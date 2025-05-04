#!/bin/bash

# Create base upload directories
mkdir -p app/middlewares/uploads/biometrics/faces
mkdir -p app/middlewares/uploads/biometrics/iris
mkdir -p app/middlewares/uploads/biometrics/fingerprints
mkdir -p app/middlewares/uploads/biometrics/documents

# Set permissions if needed
chmod -R 755 app/middlewares/uploads

echo "Biometric upload directories created successfully:"
echo "- app/middlewares/uploads/biometrics/faces"
echo "- app/middlewares/uploads/biometrics/iris"
echo "- app/middlewares/uploads/biometrics/fingerprints"
echo "- app/middlewares/uploads/biometrics/documents" 