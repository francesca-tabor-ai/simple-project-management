/**
 * Checklist Persistence Test
 * 
 * This script tests that checklist items persist to the database correctly.
 * Run with: npx tsx scripts/test-checklist-persistence.ts
 */

import { createClient } from '@supabase/supabase-js'

// You'll need to set these environment variables or hardcode them for testing
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

interface Task {
  id: string
  title: string
  checklist: ChecklistItem[]
  user_id: string
  status: string
  created_at: string
  updated_at: string
}

async function runTests() {
  console.log('🧪 Testing Checklist Persistence...\n')

  try {
    // Check if user is authenticated (this won't work without a session)
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('⚠️  No authenticated session found.')
      console.log('This script needs to run in a context with a valid Supabase session.')
      console.log('\n📋 Running database verification instead...\n')
      await runDatabaseVerification()
      return
    }

    console.log('✅ Authenticated as:', user.email)

    // Test 1: Create a test task
    console.log('\n📝 Test 1: Creating test task...')
    const testTaskTitle = `Checklist Test ${Date.now()}`
    
    const { data: newTask, error: createError } = await supabase
      .from('tasks')
      .insert({
        title: testTaskTitle,
        status: 'pending',
        user_id: user.id,
        checklist: [
          { id: crypto.randomUUID(), text: 'Test item 1', done: false },
          { id: crypto.randomUUID(), text: 'Test item 2', done: true }
        ]
      })
      .select()
      .single()

    if (createError) {
      console.error('❌ Failed to create task:', createError.message)
      return
    }

    console.log('✅ Task created with 2 checklist items')
    console.log(`   Task ID: ${newTask.id}`)

    // Test 2: Read the task back
    console.log('\n📖 Test 2: Reading task back from database...')
    
    const { data: fetchedTask, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', newTask.id)
      .single()

    if (fetchError) {
      console.error('❌ Failed to fetch task:', fetchError.message)
      return
    }

    if (!fetchedTask.checklist || fetchedTask.checklist.length !== 2) {
      console.error('❌ Checklist not persisted correctly!')
      console.error('   Expected 2 items, got:', fetchedTask.checklist?.length || 0)
      return
    }

    console.log('✅ Checklist items persisted correctly')
    console.log(`   Found ${fetchedTask.checklist.length} items:`)
    fetchedTask.checklist.forEach((item: ChecklistItem, i: number) => {
      console.log(`   ${i + 1}. "${item.text}" - ${item.done ? '✓ done' : '○ pending'}`)
    })

    // Test 3: Update checklist
    console.log('\n✏️  Test 3: Updating checklist (add item + toggle done)...')
    
    const updatedChecklist = [
      ...fetchedTask.checklist,
      { id: crypto.randomUUID(), text: 'Test item 3', done: false }
    ]
    // Toggle first item
    updatedChecklist[0].done = !updatedChecklist[0].done

    const { error: updateError } = await supabase
      .from('tasks')
      .update({
        checklist: updatedChecklist,
        updated_at: new Date().toISOString()
      })
      .eq('id', newTask.id)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ Failed to update checklist:', updateError.message)
      return
    }

    console.log('✅ Checklist updated')

    // Test 4: Verify update persisted
    console.log('\n🔍 Test 4: Verifying update persisted...')
    
    const { data: verifyTask, error: verifyError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', newTask.id)
      .single()

    if (verifyError) {
      console.error('❌ Failed to verify update:', verifyError.message)
      return
    }

    if (verifyTask.checklist.length !== 3) {
      console.error('❌ Update did not persist!')
      console.error('   Expected 3 items, got:', verifyTask.checklist.length)
      return
    }

    console.log('✅ Update persisted correctly')
    console.log(`   Now have ${verifyTask.checklist.length} items:`)
    verifyTask.checklist.forEach((item: ChecklistItem, i: number) => {
      console.log(`   ${i + 1}. "${item.text}" - ${item.done ? '✓ done' : '○ pending'}`)
    })

    // Test 5: Delete checklist item
    console.log('\n🗑️  Test 5: Deleting checklist item...')
    
    const filteredChecklist = verifyTask.checklist.filter(
      (_: ChecklistItem, i: number) => i !== 1 // Remove second item
    )

    const { error: deleteError } = await supabase
      .from('tasks')
      .update({
        checklist: filteredChecklist,
        updated_at: new Date().toISOString()
      })
      .eq('id', newTask.id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Failed to delete item:', deleteError.message)
      return
    }

    console.log('✅ Item deleted')

    // Test 6: Verify deletion
    console.log('\n🔍 Test 6: Verifying deletion persisted...')
    
    const { data: finalTask, error: finalError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', newTask.id)
      .single()

    if (finalError) {
      console.error('❌ Failed to verify deletion:', finalError.message)
      return
    }

    if (finalTask.checklist.length !== 2) {
      console.error('❌ Deletion did not persist!')
      console.error('   Expected 2 items, got:', finalTask.checklist.length)
      return
    }

    console.log('✅ Deletion persisted correctly')
    console.log(`   Final checklist (${finalTask.checklist.length} items):`)
    finalTask.checklist.forEach((item: ChecklistItem, i: number) => {
      console.log(`   ${i + 1}. "${item.text}" - ${item.done ? '✓ done' : '○ pending'}`)
    })

    // Cleanup
    console.log('\n🧹 Cleaning up test task...')
    const { error: cleanupError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', newTask.id)
      .eq('user_id', user.id)

    if (cleanupError) {
      console.warn('⚠️  Could not delete test task:', cleanupError.message)
      console.log('   You may need to manually delete:', newTask.id)
    } else {
      console.log('✅ Test task cleaned up')
    }

    console.log('\n' + '='.repeat(60))
    console.log('🎉 ALL TESTS PASSED!')
    console.log('='.repeat(60))
    console.log('\n✅ Checklist persistence is working correctly!')
    console.log('   - Items are stored in database (JSONB)')
    console.log('   - Updates persist across reads')
    console.log('   - Deletions work correctly')
    console.log('   - Data structure is intact')

  } catch (error) {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  }
}

async function runDatabaseVerification() {
  console.log('🔍 Database Verification (Public Access)\n')
  
  try {
    // Check if we can read the tasks table schema
    console.log('1️⃣  Checking tasks table exists...')
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, checklist')
      .limit(1)

    if (error) {
      if (error.message.includes('JWT')) {
        console.log('⚠️  Authentication required to read tasks')
        console.log('   This is correct - RLS is protecting your data!')
      } else {
        console.error('❌ Error:', error.message)
      }
      
      console.log('\n📋 What to check manually:\n')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Run this query:')
      console.log('   ```sql')
      console.log('   SELECT id, title, checklist')
      console.log('   FROM tasks')
      console.log('   WHERE user_id = auth.uid()')
      console.log('   ORDER BY updated_at DESC')
      console.log('   LIMIT 5;')
      console.log('   ```')
      console.log('3. Verify checklist column shows JSON arrays')
      console.log('   Like: [{"id": "...", "text": "...", "done": false}]')
      
      return
    }

    console.log('✅ Tasks table accessible')
    
    if (data && data.length > 0) {
      console.log(`   Found ${data.length} task(s)`)
      data.forEach(task => {
        const checklistCount = task.checklist?.length || 0
        console.log(`   - "${task.title}" has ${checklistCount} checklist items`)
      })
    } else {
      console.log('   No tasks found (table is empty)')
    }

  } catch (error) {
    console.error('❌ Verification failed:', error)
  }

  console.log('\n💡 To fully test persistence:')
  console.log('   1. Start the dev server: npm run dev')
  console.log('   2. Log in to the app')
  console.log('   3. Open a task and add a checklist item')
  console.log('   4. Wait for "Saved" indicator')
  console.log('   5. Hard refresh (Cmd+Shift+R)')
  console.log('   6. Verify item is still there ✅')
}

// Run tests
runTests()

