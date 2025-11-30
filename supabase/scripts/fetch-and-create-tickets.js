// =====================================================
// FETCH EMAILS FROM GMAIL & CREATE SUPPORT TICKETS
// =====================================================
// Usage: node scripts/fetch-and-create-tickets.js
// =====================================================

import Imap from 'imap'
import { simpleParser } from 'mailparser'
import pg from 'pg'
import * as dotenv from 'dotenv'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env') })
dotenv.config({ path: join(__dirname, '../.env.gmail') })

const { Client } = pg

// =====================================================
// CONFIGURATION
// =====================================================

const GMAIL_CONFIG = {
  user: process.env.GMAIL_USER || 'longsangsabo@gmail.com',
  password: process.env.GMAIL_APP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
}

const SUPPORT_ADDRESSES = [
  'support@longsang.org',
  'hello@longsang.org', 
  'contact@longsang.org'
]

// =====================================================
// MAIN LOGIC
// =====================================================

async function generateTicketNumber(client) {
  const { rows } = await client.query(`SELECT generate_ticket_number() as ticket_number`)
  return rows[0].ticket_number
}

async function processEmail(emailData, client) {
  const { from, to, subject, text, html } = emailData
  
  console.log(`\n📧 Processing: ${subject}`)
  console.log(`   From: ${from}`)
  console.log(`   To: ${to}`)

  // 1. Log inbound email
  const { rows: inboundRows } = await client.query(`
    INSERT INTO inbound_emails (from_email, to_email, subject, body_text, body_html)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [from, to, subject, text, html])
  
  const inboundId = inboundRows[0].id

  // 2. Check for existing ticket (via subject match)
  const ticketMatch = subject?.match(/TKT-\d{4}-\d{4}/)
  let ticketId = null

  if (ticketMatch) {
    const ticketNumber = ticketMatch[0]
    const { rows: ticketRows } = await client.query(`
      SELECT id FROM support_tickets WHERE ticket_number = $1
    `, [ticketNumber])
    
    if (ticketRows.length > 0) {
      ticketId = ticketRows[0].id
      console.log(`   ✅ Found existing ticket: ${ticketNumber}`)
    }
  }

  // 3. Create new ticket if needed
  if (!ticketId) {
    const ticketNumber = await generateTicketNumber(client)
    const { rows: newTicketRows } = await client.query(`
      INSERT INTO support_tickets (ticket_number, subject, customer_email, status)
      VALUES ($1, $2, $3, 'open')
      RETURNING id
    `, [ticketNumber, subject, from])
    
    ticketId = newTicketRows[0].id
    console.log(`   🎫 Created ticket: ${ticketNumber}`)
  }

  // 4. Add message to ticket
  await client.query(`
    INSERT INTO ticket_messages (ticket_id, from_email, to_email, subject, body_text, body_html, is_from_customer)
    VALUES ($1, $2, $3, $4, $5, $6, true)
  `, [ticketId, from, to, subject, text, html])

  // 5. Mark inbound as processed
  await client.query(`
    UPDATE inbound_emails SET processed = true, ticket_id = $1 WHERE id = $2
  `, [ticketId, inboundId])

  console.log(`   ✅ Ticket updated`)
  return ticketId
}

function fetchEmails() {
  return new Promise((resolve, reject) => {
    const imap = new Imap(GMAIL_CONFIG)
    const emails = []

    imap.once('ready', () => {
      console.log('📬 Connected to Gmail IMAP')
      
      imap.openBox('INBOX', false, (err, box) => {
        if (err) return reject(err)

        // Search for UNSEEN emails
        imap.search(['UNSEEN'], (err, results) => {
          if (err) return reject(err)
          
          if (!results || results.length === 0) {
            console.log('📭 No unread emails')
            imap.end()
            return resolve([])
          }

          console.log(`📬 Found ${results.length} unread email(s)`)

          const fetch = imap.fetch(results, { bodies: '' })
          
          fetch.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  console.error('❌ Parse error:', err)
                  return
                }

                const fromAddress = parsed.from?.value[0]?.address || ''
                const toAddress = parsed.to?.text || ''
                
                // Filter: Only support emails
                const isSupportEmail = SUPPORT_ADDRESSES.some(addr => 
                  toAddress.includes(addr) || 
                  parsed.subject?.includes('TKT-')
                )

                if (isSupportEmail) {
                  emails.push({
                    uid: seqno,
                    from: fromAddress,
                    to: toAddress,
                    subject: parsed.subject || '(No Subject)',
                    text: parsed.text || '',
                    html: parsed.html || parsed.textAsHtml || ''
                  })
                } else {
                  console.log(`   ⏭️  Skipped (not support): ${parsed.subject}`)
                }
              })
            })
          })

          fetch.once('end', () => {
            console.log('✅ Fetch complete')
            imap.end()
          })
        })
      })
    })

    imap.once('error', (err) => reject(err))
    
    imap.once('end', () => {
      console.log('📪 IMAP connection closed')
      resolve(emails)
    })

    imap.connect()
  })
}

async function markAsRead(uids) {
  if (uids.length === 0) return
  
  return new Promise((resolve, reject) => {
    const imap = new Imap(GMAIL_CONFIG)

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) return reject(err)

        imap.addFlags(uids, ['\\Seen'], (err) => {
          if (err) console.error('⚠️  Could not mark as read:', err)
          else console.log(`✅ Marked ${uids.length} email(s) as read`)
          imap.end()
        })
      })
    })

    imap.once('error', reject)
    imap.once('end', resolve)
    imap.connect()
  })
}

async function main() {
  console.log('\n========================================')
  console.log('  🎫 SUPPORT TICKET IMPORTER')
  console.log('========================================\n')

  // Connect to database
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  })

  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Database connected\n')

    // Fetch emails
    const emails = await fetchEmails()
    
    if (emails.length === 0) {
      console.log('\n✅ No new support emails to process')
      return
    }

    // Wait for emails to be fully parsed
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log(`\n🔄 Processing ${emails.length} email(s)...\n`)

    const processedUids = []

    for (const email of emails) {
      try {
        await processEmail(email, client)
        processedUids.push(email.uid)
      } catch (err) {
        console.error(`❌ Error processing email:`, err.message)
      }
    }

    // Mark as read
    if (processedUids.length > 0) {
      await markAsRead(processedUids)
    }

    console.log('\n========================================')
    console.log(`✅ Successfully processed ${processedUids.length}/${emails.length} email(s)`)
    console.log('========================================\n')

  } catch (err) {
    console.error('\n❌ ERROR:', err.message)
    throw err
  } finally {
    await client.end()
  }
}

// Run
main().catch(err => {
  console.error(err)
  process.exit(1)
})
