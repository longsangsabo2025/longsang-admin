#!/bin/bash

# Quick Start Script for Consultation Booking System
# This script helps you set up the consultation booking feature

echo "🚀 Consultation Booking System - Quick Start"
echo "============================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo ""
    echo "Or run the migration manually in Supabase SQL Editor:"
    echo "   File: supabase/migrations/20250111_create_consultation_booking.sql"
    exit 1
fi

echo "✅ Supabase CLI detected"
echo ""

# Ask user to confirm
echo "This will:"
echo "  1. Create consultation booking tables"
echo "  2. Set up Row Level Security policies"
echo "  3. Insert default consultation types"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Setup cancelled"
    exit 1
fi

echo ""
echo "📦 Running database migration..."
supabase db push

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎉 Next steps:"
    echo "  1. Start your dev server: npm run dev"
    echo "  2. Login as admin"
    echo "  3. Go to /admin/consultations"
    echo "  4. Click 'Cấu hình lịch làm việc'"
    echo "  5. Add your working hours"
    echo "  6. Share /consultation link with customers"
    echo ""
    echo "📖 For detailed guide, see: CONSULTATION_BOOKING_GUIDE.md"
else
    echo ""
    echo "❌ Migration failed!"
    echo "Please run the SQL manually in Supabase SQL Editor"
    exit 1
fi
