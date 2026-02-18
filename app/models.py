from app import db
from datetime import datetime
from sqlalchemy import CheckConstraint

class BudgetCategory(db.Model):
    """User-defined budget categories (expenses or income)"""
    __tablename__ = 'budget_categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category_type = db.Column(db.String(20), nullable=False)  # 'expense' or 'income'
    parent_id = db.Column(db.Integer, db.ForeignKey('budget_categories.id'), nullable=True) # For subcategories 
    is_parent_only = db.Column(db.Boolean, default=False)
    sort_order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    planned_amounts = db.relationship('PlannedAmount', back_populates='category', cascade='all, delete-orphan')
    transactions = db.relationship('Transaction', back_populates='category')

    # Parent/child relationship
    children = db.relationship('BudgetCategory', 
                              backref=db.backref('parent', remote_side=[id]),
                              foreign_keys=[parent_id]) # changes subcategories to reference parent_id instead of id
    
    __table_args__ = (
        CheckConstraint(category_type.in_(['expense', 'income']), name='valid_category_type'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category_type': self.category_type,
            'parent_id': self.parent_id,  # NEW
            'parent_name': self.parent.name if self.parent else None,  # Add this
            'is_parent_only': self.is_parent_only,
            'sort_order': self.sort_order,
            'is_active': self.is_active
        }


class PayPeriod(db.Model):
    """Pay periods (bi-weekly or custom)"""
    __tablename__ = 'pay_periods'
    
    id = db.Column(db.Integer, primary_key=True)
    start_date = db.Column(db.Date, nullable=False, unique=True)
    end_date = db.Column(db.Date, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    planned_amounts = db.relationship('PlannedAmount', back_populates='pay_period', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'startdate': self.start_date.isoformat(),
            'enddate': self.end_date.isoformat()
        }


class PlannedAmount(db.Model):
    """Planned budget amounts for each category per pay period"""
    __tablename__ = 'planned_amounts'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('budget_categories.id'), nullable=False)
    pay_period_id = db.Column(db.Integer, db.ForeignKey('pay_periods.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    is_cleared = db.Column(db.Boolean, default=False)
    due_date = db.Column(db.Date, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    category = db.relationship('BudgetCategory', back_populates='planned_amounts')
    pay_period = db.relationship('PayPeriod', back_populates='planned_amounts')
    
    __table_args__ = (
        db.UniqueConstraint('category_id', 'pay_period_id', name='unique_category_period'),
    )
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'category_name': self.category.name,
            'pay_period_id': self.pay_period_id,
            'amount': float(self.amount),
            'is_cleared': self.is_cleared,
            'due_date': self.due_date.isoformat() if self.due_date else None
        }
    
        # Only include due_date if the column exists
        #if hasattr(self, 'due_date'):
        #    result['due_date'] = self.due_date.isoformat() if self.due_date else None
    
        #return result


class Transaction(db.Model):
    """Actual bank transactions"""
    __tablename__ = 'transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    description = db.Column(db.String(255), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('budget_categories.id'), nullable=True)
    is_categorized = db.Column(db.Boolean, default=False)
    matched_planned_id = db.Column(db.Integer, db.ForeignKey('planned_amounts.id'), nullable=True)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    category = db.relationship('BudgetCategory', back_populates='transactions')
    matched_planned = db.relationship('PlannedAmount', foreign_keys=[matched_planned_id])
    
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat(),
            'description': self.description,
            'amount': float(self.amount),
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'is_categorized': self.is_categorized,
            'matched_planned_id': self.matched_planned_id,
            'notes': self.notes
        }


class CategoryRule(db.Model):
    """Auto-categorization rules based on transaction descriptions"""
    __tablename__ = 'category_rules'
    
    id = db.Column(db.Integer, primary_key=True)
    pattern = db.Column(db.String(100), nullable=False)  # Text pattern to match
    category_id = db.Column(db.Integer, db.ForeignKey('budget_categories.id'), nullable=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    category = db.relationship('BudgetCategory')
    
    def to_dict(self):
        return {
            'id': self.id,
            'pattern': self.pattern,
            'category_id': self.category_id,
            'category_name': self.category.name,
            'is_active': self.is_active
        }


class RecurringTemplate(db.Model):
    """Templates for recurring expenses/income"""
    __tablename__ = 'recurring_templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('budget_categories.id'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    frequency = db.Column(db.String(20), nullable=False)  # 'every_period', 'monthly', 'bi_monthly'
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    category = db.relationship('BudgetCategory')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'category_id': self.category_id,
            'category_name': self.category.name,
            'amount': float(self.amount),
            'frequency': self.frequency,
            'is_active': self.is_active
        }
