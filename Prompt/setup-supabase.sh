#!/bin/bash

echo "🚀 Aqeel AI Memory Assistant - Supabase Setup"
echo "=============================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://tbvomihjxxwmsfuhvhfb.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# OpenAI Configuration (optional)
VITE_OPENAI_API_KEY=your_openai_api_key_here
EOF
    echo "✅ .env file created!"
else
    echo "✅ .env file already exists"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Get your Supabase anon key from:"
echo "   https://supabase.com/dashboard/project/tbvomihjxxwmsfuhvhfb/settings/api"
echo ""
echo "2. Update the .env file with your anon key"
echo ""
echo "3. Run the SQL schema in your Supabase SQL Editor:"
echo "   - Go to: https://supabase.com/dashboard/project/tbvomihjxxwmsfuhvhfb/sql"
echo "   - Copy and paste the contents of supabase-schema.sql"
echo ""
echo "4. Start the development server:"
echo "   npm run dev"
echo ""
echo "5. Go to Settings → Data Storage → Use Supabase"
echo ""
echo "�� You're all set!" 