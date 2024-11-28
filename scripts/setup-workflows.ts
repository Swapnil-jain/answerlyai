import { promises as fs } from 'fs'
import path from 'path'

async function setupWorkflowsDirectory() {
  try {
    const workflowsDir = path.join(process.cwd(), 'workflows')
    await fs.mkdir(workflowsDir, { recursive: true })
    console.log('Workflows directory created successfully')
  } catch (error) {
    console.error('Error creating workflows directory:', error)
  }
}

setupWorkflowsDirectory() 