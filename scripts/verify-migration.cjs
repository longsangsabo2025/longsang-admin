/**
 * Verify AI Workspace Migration
 * Verify database tables and functions after migration
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTables() {
    const tables = [
        'documents',
        'conversations',
        'agent_executions',
        'response_cache',
        'news_digests',
        'financial_summaries'
    ];

    console.log('📋 Checking tables...');

    let allPassed = true;

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .limit(1);

            if (error) {
                if (error.code === 'PGRST116') {
                    console.log('⚠️  Table \'' + table + '\' does not exist');
                    allPassed = false;
                } else {
                    console.log('❌ Error checking \'' + table + '\': ' + error.message);
                    allPassed = false;
                }
            } else {
                console.log('✅ Table \'' + table + '\' exists');
            }
        } catch (err) {
            console.log('❌ Exception checking \'' + table + '\': ' + err.message);
            allPassed = false;
        }
    }

    // Check vector extension
    try {
        const { data, error } = await supabase.rpc('match_documents', {
            query_embedding: new Array(1536).fill(0),
            match_threshold: 0.5,
            match_count: 1
        });

        if (error) {
            if (error.message.includes('function') || error.message.includes('does not exist')) {
                console.log('⚠️  Vector extension or match_documents function may not be set up');
                allPassed = false;
            } else {
                console.log('⚠️  match_documents function check: ' + error.message);
            }
        } else {
            console.log('✅ Vector extension and match_documents function are working');
        }
    } catch (err) {
        console.log('⚠️  Could not verify vector extension: ' + err.message);
    }

    return allPassed;
}

verifyTables()
    .then((passed) => {
        if (passed) {
            console.log('\n✅ Verification complete - All tables exist');
        } else {
            console.log('\n⚠️  Verification complete - Some tables may be missing');
            console.log('💡 Run migration SQL manually in Supabase Dashboard if needed');
        }
        process.exit(passed ? 0 : 1);
    })
    .catch((err) => {
        console.error('❌ Verification failed:', err);
        process.exit(1);
    });

