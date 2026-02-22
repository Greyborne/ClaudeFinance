from flask import Blueprint, render_template, request, jsonify, send_file
from app import db
from app.models import BudgetCategory, PayPeriod, PlannedAmount, Transaction, CategoryRule, RecurringTemplate
from datetime import datetime, timedelta
from decimal import Decimal
import pandas as pd
import os
from werkzeug.utils import secure_filename

main = Blueprint('main', __name__)

ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ==================== WEB PAGES ====================

@main.route('/')
def index():
    """Main dashboard"""
    return render_template('index.html')


# ==================== CATEGORY MANAGEMENT ====================

@main.route('/api/categories', methods=['GET', 'POST'])
def manage_categories():
    """Get all categories or create a new one"""
    if request.method == 'GET':
        categories = BudgetCategory.query.filter_by(is_active=True).order_by(
            BudgetCategory.category_type, BudgetCategory.sort_order
        ).all()
        return jsonify([cat.to_dict() for cat in categories])
    
    elif request.method == 'POST':
        data = request.json
        
        # Validate parent_id if provided
        parent_id = data.get('parent_id')
        if parent_id:
            parent = BudgetCategory.query.get(parent_id)
            if not parent:
                return jsonify({'error': 'Parent category not found'}), 404
            if parent.category_type != data['category_type']:
                return jsonify({'error': 'Parent and child must have same category type'}), 400
            if not parent.is_active:
                return jsonify({'error': 'Parent category is inactive'}), 400
        
        # If is_parent_only is True, it should not have a parent
        is_parent_only = data.get('is_parent_only', False)
        if is_parent_only and parent_id:
            return jsonify({'error': 'Parent-only categories cannot have a parent'}), 400
        
        category = BudgetCategory(
            name=data['name'],
            category_type=data['category_type'],
            parent_id=parent_id,
            is_parent_only=is_parent_only,  # NEW
            sort_order=data.get('sort_order', 0)
        )
        
        db.session.add(category)
        db.session.commit()
        
        return jsonify(category.to_dict()), 201



@main.route('/api/categories/<int:category_id>', methods=['PUT', 'DELETE'])
def update_category(category_id):
    """Update or delete a category"""
    category = BudgetCategory.query.get_or_404(category_id)
    
    if request.method == 'PUT':
        data = request.json
        
        # Update is_parent_only
        if 'is_parent_only' in data:
            is_parent_only = data['is_parent_only']
            
            # If making it parent-only, check it has no transactions/planned amounts
            if is_parent_only and not category.is_parent_only:
                if category.transactions:
                    return jsonify({'error': 'Cannot make parent-only: category has transactions'}), 400
                if category.planned_amounts:
                    return jsonify({'error': 'Cannot make parent-only: category has planned amounts'}), 400
            
            category.is_parent_only = is_parent_only
        
        # Rest of update logic...
        if 'parent_id' in data:
            parent_id = data['parent_id']
            
            if parent_id:
                if parent_id == category_id:
                    return jsonify({'error': 'Category cannot be its own parent'}), 400
                
                parent = BudgetCategory.query.get(parent_id)
                if not parent:
                    return jsonify({'error': 'Parent category not found'}), 404
                if parent.category_type != category.category_type:
                    return jsonify({'error': 'Parent must have same category type'}), 400
                if is_descendant(parent, category):
                    return jsonify({'error': 'Cannot create circular hierarchy'}), 400
            
            category.parent_id = parent_id
        
        if 'name' in data:
            category.name = data['name']
        if 'sort_order' in data:
            category.sort_order = data['sort_order']
        
        db.session.commit()
        return jsonify(category.to_dict())
    
    elif request.method == 'DELETE':
        if category.children:
            return jsonify({'error': 'Cannot delete category with subcategories'}), 400
        
        category.is_active = False
        db.session.commit()
        return '', 204

# Helper function to prevent circular hierarchies
def is_descendant(potential_parent, category):
    """Check if potential_parent is a descendant of category"""
    current = potential_parent
    while current.parent_id:
        if current.parent_id == category.id:
            return True
        current = current.parent
    return False

# ==================== PAY PERIOD MANAGEMENT ====================

@main.route('/api/pay-periods', methods=['GET', 'POST'])
def manage_pay_periods():
    """Get all pay periods or create new ones"""
    if request.method == 'GET':
        periods = PayPeriod.query.order_by(PayPeriod.start_date).all()
        return jsonify([p.to_dict() for p in periods])
    
    elif request.method == 'POST':
        data = request.json
        
        # If generating multiple periods
        if 'generate_count' in data:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            count = data['generate_count']
            interval_days = data.get('interval_days', 14)
            
            periods = []
            for i in range(count):
                period_start = start_date + timedelta(days=i * interval_days)
                period_end = period_start + timedelta(days=interval_days - 1)
                
                # Check if period already exists
                existing = PayPeriod.query.filter_by(start_date=period_start).first()
                if not existing:
                    period = PayPeriod(start_date=period_start, end_date=period_end)
                    db.session.add(period)
                    periods.append(period)
            
            db.session.commit()
            return jsonify([p.to_dict() for p in periods]), 201
        
        # Single period
        else:
            start_date = datetime.strptime(data['start_date'], '%Y-%m-%d').date()
            end_date = datetime.strptime(data['end_date'], '%Y-%m-%d').date()
            
            period = PayPeriod(start_date=start_date, end_date=end_date)
            db.session.add(period)
            db.session.commit()
            return jsonify(period.to_dict()), 201


# ==================== PLANNED AMOUNTS ====================

@main.route('/api/planned-amounts', methods=['GET', 'POST'])
def manage_planned_amounts():
    """Get or create planned amounts"""
    if request.method == 'GET':
        planned = PlannedAmount.query.join(BudgetCategory).join(PayPeriod).order_by(
            PayPeriod.start_date, BudgetCategory.sort_order
        ).all()
        return jsonify([p.to_dict() for p in planned])
    
    elif request.method == 'POST':
        data = request.json
        
        # Check if already exists
        existing = PlannedAmount.query.filter_by(
            category_id=data['category_id'],
            pay_period_id=data['pay_period_id']
        ).first()
        
        if existing:
            existing.amount = Decimal(str(data['amount']))
            if 'due_date' in data and data['due_date']:
                existing.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            db.session.commit()
            return jsonify(existing.to_dict())
        else:
            planned = PlannedAmount(
                category_id=data['category_id'],
                pay_period_id=data['pay_period_id'],
                amount=Decimal(str(data['amount']))
            )
            if 'due_date' in data and data['due_date']:
                planned.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date()
            db.session.add(planned)
            db.session.commit()
            return jsonify(planned.to_dict()), 201


@main.route('/api/planned-amounts/<int:planned_id>', methods=['PUT'])
def update_planned_amount(planned_id):
    """Update a planned amount"""
    planned = PlannedAmount.query.get_or_404(planned_id)
    data = request.json
    
    if 'amount' in data:
        planned.amount = Decimal(str(data['amount']))
    if 'is_cleared' in data:
        planned.is_cleared = data['is_cleared']
    
    db.session.commit()
    return jsonify(planned.to_dict())


# ==================== TRANSACTIONS ====================

@main.route('/api/transactions', methods=['GET', 'POST'])
def manage_transactions():
    """Get all transactions or add a new one"""
    if request.method == 'GET':
        transactions = Transaction.query.order_by(Transaction.date.desc()).all()
        return jsonify([t.to_dict() for t in transactions])
    
    elif request.method == 'POST':
        data = request.json
        transaction = Transaction(
            date=datetime.strptime(data['date'], '%Y-%m-%d').date(),
            description=data['description'],
            amount=Decimal(str(data['amount'])),
            category_id=data.get('category_id'),
            is_categorized=bool(data.get('category_id')),
            notes=data.get('notes')
        )
        db.session.add(transaction)
        db.session.commit()
        return jsonify(transaction.to_dict()), 201


@main.route('/api/transactions/import', methods=['POST'])
def import_transactions():
    """Import transactions from CSV file"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file'}), 400
    
    filename = secure_filename(file.filename)
    filepath = os.path.join('/app/uploads', filename)
    file.save(filepath)
    
    try:
        # Read CSV
        if filename.endswith('.csv'):
            df = pd.read_csv(filepath)
        else:
            df = pd.read_excel(filepath)
        
        # Expected columns: Date, Description, Amount (or similar)
        # Try to find the right columns
        df.columns = df.columns.str.strip().str.lower()
        
        date_col = next((col for col in df.columns if 'date' in col), None)
        desc_col = next((col for col in df.columns if 'desc' in col or 'merchant' in col or 'name' in col), None)
        amount_col = next((col for col in df.columns if 'amount' in col or 'debit' in col or 'credit' in col), None)
        
        if not all([date_col, desc_col, amount_col]):
            return jsonify({'error': 'Could not identify Date, Description, and Amount columns'}), 400
        
        imported_count = 0
        categorized_count = 0
        
        for _, row in df.iterrows():
            try:
                # Parse date
                trans_date = pd.to_datetime(row[date_col]).date()
                description = str(row[desc_col])
                amount = Decimal(str(row[amount_col]))
                
                # Check for duplicate
                existing = Transaction.query.filter_by(
                    date=trans_date,
                    description=description,
                    amount=amount
                ).first()
                
                if existing:
                    continue
                
                # Try to auto-categorize
                category_id = None
                rules = CategoryRule.query.filter_by(is_active=True).all()
                for rule in rules:
                    if rule.pattern.lower() in description.lower():
                        category_id = rule.category_id
                        categorized_count += 1
                        break
                
                transaction = Transaction(
                    date=trans_date,
                    description=description,
                    amount=amount,
                    category_id=category_id,
                    is_categorized=bool(category_id)
                )
                db.session.add(transaction)
                imported_count += 1
                
            except Exception as e:
                print(f"Error importing row: {e}")
                continue
        
        db.session.commit()
        os.remove(filepath)
        
        return jsonify({
            'imported': imported_count,
            'auto_categorized': categorized_count,
            'message': f'Imported {imported_count} transactions ({categorized_count} auto-categorized)'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@main.route('/api/transactions/<int:transaction_id>/categorize', methods=['PUT'])
def categorize_transaction(transaction_id):
    """Manually categorize a transaction"""
    transaction = Transaction.query.get_or_404(transaction_id)
    data = request.json
    
    transaction.category_id = data['category_id']
    transaction.is_categorized = True
    
    # Try to match with a planned amount
    if data.get('auto_match', False):
        category = BudgetCategory.query.get(data['category_id'])
        if category:
            # Find pay period for this transaction
            pay_period = PayPeriod.query.filter(
                PayPeriod.start_date <= transaction.date,
                PayPeriod.end_date >= transaction.date
            ).first()
            
            if pay_period:
                # Find planned amount
                planned = PlannedAmount.query.filter_by(
                    category_id=category.id,
                    pay_period_id=pay_period.id,
                    is_cleared=False
                ).first()
                
                if planned:
                    transaction.matched_planned_id = planned.id
                    planned.is_cleared = True
    
    db.session.commit()
    return jsonify(transaction.to_dict())


# ==================== CATEGORY RULES ====================

@main.route('/api/category-rules', methods=['GET', 'POST'])
def manage_category_rules():
    """Get or create category rules"""
    if request.method == 'GET':
        rules = CategoryRule.query.filter_by(is_active=True).all()
        return jsonify([r.to_dict() for r in rules])
    
    elif request.method == 'POST':
        data = request.json
        rule = CategoryRule(
            pattern=data['pattern'],
            category_id=data['category_id']
        )
        db.session.add(rule)
        db.session.commit()
        return jsonify(rule.to_dict()), 201


@main.route('/api/category-rules/<int:rule_id>', methods=['DELETE'])
def delete_category_rule(rule_id):
    """Delete a category rule"""
    rule = CategoryRule.query.get_or_404(rule_id)
    rule.is_active = False
    db.session.commit()
    return '', 204


# ==================== RECURRING TEMPLATES ====================

@main.route('/api/recurring-templates', methods=['GET', 'POST'])
def manage_recurring_templates():
    """Get or create recurring templates"""
    if request.method == 'GET':
        templates = RecurringTemplate.query.filter_by(is_active=True).all()
        return jsonify([t.to_dict() for t in templates])
    
    elif request.method == 'POST':
        data = request.json
        template = RecurringTemplate(
            name=data['name'],
            category_id=data['category_id'],
            amount=Decimal(str(data['amount'])),
            frequency=data['frequency']
        )
        db.session.add(template)
        db.session.commit()
        return jsonify(template.to_dict()), 201


@main.route('/api/recurring-templates/<int:template_id>/apply', methods=['POST'])
def apply_recurring_template(template_id):
    """Apply a recurring template to pay periods"""
    template = RecurringTemplate.query.get_or_404(template_id)
    data = request.json
    
    pay_period_ids = data.get('pay_period_ids', [])
    applied_count = 0
    
    for period_id in pay_period_ids:
        # Check if already exists
        existing = PlannedAmount.query.filter_by(
            category_id=template.category_id,
            pay_period_id=period_id
        ).first()
        
        if not existing:
            planned = PlannedAmount(
                category_id=template.category_id,
                pay_period_id=period_id,
                amount=template.amount
            )
            db.session.add(planned)
            applied_count += 1
    
    db.session.commit()
    return jsonify({'applied_count': applied_count})


# ==================== ANALYTICS ====================

@main.route('/api/analytics/budget-vs-actual', methods=['GET'])
def budget_vs_actual():
    from sqlalchemy import func, Integer  # ← add Integer here

    planned_total = db.session.query(func.sum(PlannedAmount.amount)).scalar() or 0.0

    actual_total = db.session.query(
        func.sum(func.coalesce(Transaction.amount, 0))
    ).filter(Transaction.amount < 0).scalar() or 0.0

    # Per-category
    results = db.session.query(
        BudgetCategory.name.label('category_name'),
        BudgetCategory.id.label('category_id'),
        func.sum(PlannedAmount.amount).label('planned'),
        func.sum(
            func.coalesce(
                Transaction.amount * (Transaction.amount < 0).cast(Integer), 
                0
            )
        ).label('actual')
    ).outerjoin(PlannedAmount, PlannedAmount.category_id == BudgetCategory.id
    ).outerjoin(Transaction, Transaction.category_id == BudgetCategory.id
    ).filter(BudgetCategory.category_type == 'expense'
    ).group_by(BudgetCategory.id, BudgetCategory.name
    ).all()

    categories = [{
        'category_name': r.category_name,
        'category_id': r.category_id,
        'planned': float(r.planned or 0),
        'actual': float(r.actual or 0)
    } for r in results]

    return jsonify({
        'planned_total': float(planned_total),
        'actual_total': float(actual_total),
        'difference': float(planned_total - actual_total),
        'categories': categories
    })

@main.route('/api/analytics/spending-trend')
def spending_trend():
    """Get spending trend over pay periods"""
    from sqlalchemy import func
    
    results = db.session.query(
        PayPeriod.start_date,
        func.sum(Transaction.amount).label('total_spent')
    ).join(
        Transaction,
        db.and_(
            Transaction.date >= PayPeriod.start_date,
            Transaction.date <= PayPeriod.end_date
        )
    ).group_by(PayPeriod.start_date).order_by(PayPeriod.start_date).all()
    
    return jsonify([{
        'period': row.start_date.isoformat(),
        'total': float(row.total_spent) if row.total_spent else 0
    } for row in results])

# ==================== Recurring Expenses ====================

@main.route('/api/expenses/recurring', methods=['POST'])
def create_recurring_expense():
    """Create a recurring expense with due date that auto-populates pay periods"""
    data = request.json
    
    category_id = data['category_id']
    amount = Decimal(str(data['amount']))
    due_day = data['due_day']  # Day of month (1-31)
    frequency = data.get('frequency', 'monthly')  # monthly, bimonthly, quarterly
    
    # Get all pay periods
    pay_periods = PayPeriod.query.order_by(PayPeriod.start_date).all()
    
    created_count = 0
    for period in pay_periods:
        # Calculate due date for this period
        due_date = None
        
        if frequency == 'monthly':
            # Find the due day within this pay period
            current_date = period.start_date
            while current_date <= period.end_date:
                if current_date.day == due_day:
                    due_date = current_date
                    break
                current_date += timedelta(days=1)
        
        elif frequency == 'everyperiod':
            # Use the due_day as offset from start (e.g., day 5 of period)
            due_date = period.start_date + timedelta(days=due_day - 1)
            if due_date > period.end_date:
                due_date = None
        
        # Create planned amount if due date falls in this period
        if due_date:
            existing = PlannedAmount.query.filter_by(
                category_id=category_id,
                pay_period_id=period.id
            ).first()
            
            if not existing:
                planned = PlannedAmount(
                    category_id=category_id,
                    pay_period_id=period.id,
                    amount=amount,
                    due_date=due_date
                )
                db.session.add(planned)
                created_count += 1
    
    db.session.commit()
    return jsonify({'created': created_count, 'message': f'Created {created_count} recurring expenses'})


@main.route('/api/planned-amounts/<int:planned_id>/due-date', methods=['PUT'])
def update_due_date(planned_id):
    """Update the due date for a specific planned amount"""
    planned = PlannedAmount.query.get_or_404(planned_id)
    data = request.json
    
    if 'due_date' in data:
        planned.due_date = datetime.strptime(data['due_date'], '%Y-%m-%d').date() if data['due_date'] else None
    
    db.session.commit()
    return jsonify(planned.to_dict())


@main.route('/api/categories/<int:category_id>/reorder', methods=['POST'])
def reorder_category(category_id):
    data = request.json
    direction = data.get('direction')  # 'up' or 'down'

    category = BudgetCategory.query.get_or_404(category_id)
    siblings = BudgetCategory.query.filter_by(
        parent_id=category.parent_id,
        category_type=category.category_type
    ).order_by(BudgetCategory.sort_order).all()

    current_idx = next((i for i, c in enumerate(siblings) if c.id == category_id), None)
    if current_idx is None:
        return jsonify({'error': 'Category not found in list'}), 404

    if direction == 'up' and current_idx > 0:
        swap_with = siblings[current_idx - 1]
    elif direction == 'down' and current_idx < len(siblings) - 1:
        swap_with = siblings[current_idx + 1]
    else:
        return jsonify({'message': 'No change needed'}), 200

    # Swap sort_order
    temp = category.sort_order
    category.sort_order = swap_with.sort_order
    swap_with.sort_order = temp

    db.session.commit()
    return jsonify({'message': 'Reordered'})