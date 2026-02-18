#!/bin/bash

echo "=== DIAGNOSTIC REPORT ==="
echo ""

echo "Step 1: Check local files exist"
echo "--------------------------------"
if [ -f "run.py" ]; then
    echo "✅ run.py exists locally"
else
    echo "❌ run.py MISSING locally"
    exit 1
fi

if [ -d "app" ]; then
    echo "✅ app/ folder exists locally"
else
    echo "❌ app/ folder MISSING locally"
    exit 1
fi

echo ""
echo "Step 2: Build fresh image"
echo "-------------------------"
docker build -t budget-test .

echo ""
echo "Step 3: Check what's in the container /app directory"
echo "----------------------------------------------------"
docker run --rm budget-test ls -lah /app

echo ""
echo "Step 4: Try to find run.py specifically"
echo "---------------------------------------"
docker run --rm budget-test find /app -name "run.py"

echo ""
echo "Step 5: Try running Python"
echo "--------------------------"
docker run --rm budget-test python --version

echo ""
echo "Step 6: Try running the actual command"
echo "--------------------------------------"
docker run --rm budget-test pwd
docker run --rm budget-test ls -la
docker run --rm budget-test python run.py --help 2>&1 | head -5

echo ""
echo "=== END DIAGNOSTIC ==="
