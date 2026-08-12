#!/bin/bash
# Start Protein Tracker frontend dev server

echo "🚀 Starting Protein Tracker (Frontend + Supabase)..."
echo ""

cd "$(dirname "$0")/frontend" && PATH=/usr/local/bin:$PATH npm run dev
