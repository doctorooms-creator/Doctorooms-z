#!/bin/bash
export DATABASE_URL='postgresql://postgres.dauhputqahqutczyrfme:G0cnC7YTpQ991xpK@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true'
export DIRECT_URL='postgresql://postgres.dauhputqahqutczyrfme:G0cnC7YTpQ991xpK@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres'
cd /home/z/my-project
exec bun run dev
