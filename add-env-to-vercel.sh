#!/bin/bash

# Add Supabase env variables
echo "Adding VITE_SUPABASE_URL..."
echo "https://diexsbzqwsbpilsymnfb.supabase.co" | vercel env add VITE_SUPABASE_URL production --token btxycyXu6TBYBUIz8Pbv3AwI

echo "Adding VITE_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpZXhzYnpxd3NicGlsc3ltbmZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTIxOTEsImV4cCI6MjA3NTk2ODE5MX0.Nf1wHe7EDONS25Yv987KqhgyvZu07COnu6qgC0qCy2I" | vercel env add VITE_SUPABASE_ANON_KEY production --token btxycyXu6TBYBUIz8Pbv3AwI

echo "Redeploying..."
vercel --prod --token btxycyXu6TBYBUIz8Pbv3AwI

echo "Done!"
