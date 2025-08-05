# 🧪 Database Integration Testing Guide

This guide will help you test and verify that your local PostgreSQL database integration is working correctly with your RAG-powered productivity app.

## 🚀 Quick Test Checklist

### 1. Database Setup Verification

```bash
# Check if database is running
npm run db:start

# Check database logs
npm run db:logs

# Test connection
npm run db:connect
```

### 2. App Integration Testing

1. **Start your development server:**
   ```bash
   npm run dev
   ```

2. **Open the app and navigate to Dashboard**
   - You should see the "Database Test" component
   - Check the database status indicator in the Chat page

3. **Run the automated tests:**
   - Click "Run Database Tests" in the Dashboard
   - Verify all tests pass (Connection, Create, Search)

## 🔍 Manual Testing Steps

### Step 1: Database Connection Test

1. **Check Database Status Component**
   - Look for the database status indicator in the Chat page header
   - Should show "Database Connected" with green indicator
   - If not connected, click "Test Connection"

2. **Verify Environment Variables**
   - Check `.env.local` file exists
   - Ensure `VITE_DATABASE_URL` is set correctly
   - Verify `VITE_OPENAI_API_KEY` is configured

### Step 2: Data Migration Test

1. **Switch to Database Mode**
   - Click "Switch to Database" button
   - Confirm migration modal appears
   - Click "Migrate Data" to move localStorage data to database

2. **Verify Migration Success**
   - Check that data count shows the same numbers
   - Verify interactions, memories, and action items are preserved

### Step 3: RAG Functionality Test

1. **Test Memory Creation**
   - Go to Chat page
   - Send a message like: "I need to finish the project proposal by Friday"
   - Check that a memory is created in the database

2. **Test Memory Retrieval**
   - Send a follow-up message: "What deadlines do I have?"
   - Verify the AI response references your previous message
   - Check that RAG context is being used

3. **Test Search Functionality**
   - Go to Search page
   - Search for "proposal" or "deadline"
   - Verify results include your previous interactions

### Step 4: Action Item Extraction Test

1. **Test Action Item Creation**
   - Send a message with action words: "Please create a new feature and test it thoroughly"
   - Check that action items are extracted and saved
   - Verify they appear in the Action Items page

2. **Test Action Item Management**
   - Mark an action item as completed
   - Verify the change persists in the database
   - Delete an action item and verify it's removed

## 🛠️ Troubleshooting

### Database Connection Issues

**Problem:** Database status shows "Disconnected"

**Solutions:**
```bash
# 1. Check if Docker container is running
docker ps

# 2. Restart the database
npm run db:stop
npm run db:start

# 3. Check database logs
npm run db:logs

# 4. Verify environment variables
cat .env.local
```

**Problem:** "Connection refused" error

**Solutions:**
- Ensure Docker is running
- Check if port 5432 is available
- Verify the database URL in `.env.local`

### Migration Issues

**Problem:** Migration fails with errors

**Solutions:**
1. Check database connection first
2. Verify schema is properly applied
3. Check browser console for detailed error messages
4. Try running migration again

**Problem:** Data not appearing after migration

**Solutions:**
1. Refresh the page
2. Check if `useDatabase` is set to `true` in localStorage
3. Verify data exists in the database directly

### RAG Issues

**Problem:** No context being used in responses

**Solutions:**
1. Verify RAG is enabled (green indicator)
2. Check that memories are being created
3. Ensure OpenAI API key is configured
4. Check browser console for embedding errors

**Problem:** Search not returning results

**Solutions:**
1. Verify memories exist in the database
2. Check that embeddings are being generated
3. Test with different search terms
4. Verify vector similarity search is working

## 📊 Performance Testing

### Database Performance

1. **Connection Pool Test**
   ```typescript
   // Check database stats
   const stats = await dbService.getDatabaseStats();
   console.log('Connection pool stats:', stats);
   ```

2. **Query Performance**
   - Monitor response times for database operations
   - Check for slow queries in database logs
   - Verify indexes are being used

### RAG Performance

1. **Embedding Generation**
   - Monitor time to generate embeddings
   - Check for rate limiting from OpenAI
   - Verify batch operations are working

2. **Similarity Search**
   - Test search performance with large datasets
   - Monitor vector similarity query times
   - Verify index performance

## 🔧 Advanced Testing

### Database Schema Verification

```bash
# Connect to database
npm run db:connect

# Check tables exist
\dt

# Check extensions
\dx

# Verify vector extension
SELECT * FROM pg_extension WHERE extname = 'vector';

# Check indexes
\di
```

### Data Integrity Test

1. **Create test data**
2. **Switch between localStorage and database**
3. **Verify data consistency**
4. **Test concurrent operations**

### Error Handling Test

1. **Disconnect database while app is running**
2. **Test with invalid API keys**
3. **Test with network interruptions**
4. **Verify graceful fallbacks**

## 📈 Monitoring and Logs

### Database Logs

```bash
# View real-time logs
npm run db:logs

# Check for errors
docker logs aqeel-postgres 2>&1 | grep ERROR
```

### Application Logs

1. **Browser Console**
   - Check for JavaScript errors
   - Monitor API calls
   - Verify database operations

2. **Network Tab**
   - Monitor database connection
   - Check for failed requests
   - Verify response times

## ✅ Success Criteria

Your database integration is working correctly when:

- ✅ Database status shows "Connected" (green)
- ✅ All automated tests pass
- ✅ Data migration completes successfully
- ✅ RAG context is used in AI responses
- ✅ Search returns relevant results
- ✅ Action items are extracted and saved
- ✅ Data persists between page refreshes
- ✅ Switching between storage modes works
- ✅ Performance is acceptable (< 2s for most operations)

## 🚨 Common Issues and Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Database disconnected | Docker not running | Start Docker and run `npm run db:start` |
| Migration fails | Schema not applied | Run `npm run setup-db` again |
| No RAG context | OpenAI API key missing | Add API key to `.env.local` |
| Slow performance | No indexes | Verify schema includes all indexes |
| Data not saving | Database connection lost | Check connection and retry |

## 📞 Getting Help

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Review the database logs**
3. **Check browser console for errors**
4. **Verify all prerequisites are met**
5. **Test with a fresh database setup**

---

Your database integration should now be fully functional! 🎉 