#!/bin/bash
# Run this on your LOCAL machine to switch to Supabase PostgreSQL
# Usage: chmod +x scripts/switch-to-supabase.sh && ./scripts/switch-to-supabase.sh

echo "🔄 Switching to Supabase PostgreSQL..."

# Update .env
sed -i '' 's|^DATABASE_URL=.*|# === LOCAL DEVELOPMENT (Sandbox) ===\n# DATABASE_URL=file:/home/z/my-project/db/custom.db\n\n# === SUPABASE (Uncomment when running locally) ===\nDATABASE_URL=postgresql://postgres:v2LjqleRAavto9Vh@db.dauhputqahqutczyrfme.supabase.co:5432/postgres|' .env 2>/dev/null || \
sed -i 's|^DATABASE_URL=.*|DATABASE_URL=postgresql://postgres:v2LjqleRAavto9Vh@db.dauhputqahqutczyrfme.supabase.co:5432/postgres|' .env

# Update schema
sed -i 's|provider = "sqlite"|provider = "postgresql"|' prisma/schema.prisma

echo "✅ Switched to PostgreSQL"
echo "📦 Running: prisma db push"
npx prisma db push --accept-data-loss
echo "📦 Running: prisma generate"
npx prisma generate
echo "📦 Running: seed"
npx tsx prisma/seed.ts
echo ""
echo "✅ Done! Run 'bun run dev' to start"
