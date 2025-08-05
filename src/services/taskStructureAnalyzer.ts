import { openaiService } from './openai';

export interface TaskStructure {
  mainTask: string;
  subtasks: string[];
  confidence: number;
  reasoning: string;
}

export interface TaskAnalysisResult {
  structure: TaskStructure;
  shouldCreateSubtasks: boolean;
  estimatedDuration?: number;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export class TaskStructureAnalyzer {
  private static instance: TaskStructureAnalyzer;

  static getInstance(): TaskStructureAnalyzer {
    if (!TaskStructureAnalyzer.instance) {
      TaskStructureAnalyzer.instance = new TaskStructureAnalyzer();
    }
    return TaskStructureAnalyzer.instance;
  }

  /**
   * Analyzes AI response to determine if it contains single task or multiple subtasks
   */
  async analyzeResponse(response: string): Promise<TaskAnalysisResult> {
    try {
      // First try AI-based analysis for better accuracy
      const aiAnalysis = await this.performAIAnalysis(response);
      
      // Fallback to rule-based analysis if AI fails
      if (!aiAnalysis || aiAnalysis.confidence < 0.7) {
        const ruleAnalysis = this.performRuleBasedAnalysis(response);
        return ruleAnalysis;
      }

      return aiAnalysis;
    } catch (error) {
      console.warn('AI analysis failed, falling back to rule-based analysis:', error);
      return this.performRuleBasedAnalysis(response);
    }
  }

  /**
   * AI-powered analysis using OpenAI to detect task structure
   */
  private async performAIAnalysis(response: string): Promise<TaskAnalysisResult> {
    if (!openaiService.isInitialized()) {
      throw new Error('OpenAI service not initialized');
    }

    const systemPrompt = `You are a task structure analyzer. Analyze the given AI response and determine if it contains:
1. A single main task, OR
2. A main task with multiple subtasks

Return a JSON object with this exact structure:
{
  "main_task": "The main task description",
  "subtasks": ["subtask1", "subtask2", ...] or [] if single task,
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of your analysis",
  "estimated_duration_minutes": number or null,
  "priority": "low|medium|high",
  "category": "Work|Personal|Health|Learning|Finance|Home|Travel|General"
}

Rules:
- If response has 1 clear action → single task, empty subtasks array
- If response has multiple distinct steps → main task + subtasks
- Main task should be a high-level summary
- Subtasks should be specific, actionable steps
- Confidence should reflect how certain you are about the structure
- Priority: high (urgent/critical), medium (normal), low (optional/consider)
- Category: choose most appropriate from the list

Examples:
Input: "Create a marketing plan for Q4"
Output: {"main_task": "Create a marketing plan for Q4", "subtasks": [], "confidence": 0.9, "reasoning": "Single clear action", "estimated_duration_minutes": 120, "priority": "medium", "category": "Work"}

Input: "To launch the product, first research competitors, then create a timeline, design marketing materials, and prepare a press release"
Output: {"main_task": "Launch the product", "subtasks": ["Research competitors", "Create a timeline", "Design marketing materials", "Prepare a press release"], "confidence": 0.95, "reasoning": "Multiple distinct steps identified", "estimated_duration_minutes": 480, "priority": "high", "category": "Work"}`;

    const userPrompt = `Analyze this AI response:\n\n${response}`;

    try {
      const aiResponse = await openaiService.generateResponse([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], 'gpt-3.5-turbo');

      // Parse the JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        structure: {
          mainTask: parsed.main_task || 'Task from AI response',
          subtasks: parsed.subtasks || [],
          confidence: parsed.confidence || 0.5,
          reasoning: parsed.reasoning || 'AI analysis completed'
        },
        shouldCreateSubtasks: (parsed.subtasks || []).length > 0,
        estimatedDuration: parsed.estimated_duration_minutes || undefined,
        priority: parsed.priority || 'medium',
        category: parsed.category || 'General'
      };
    } catch (error) {
      console.error('Error parsing AI analysis:', error);
      throw error;
    }
  }

  /**
   * Rule-based analysis as fallback when AI is not available
   */
  private performRuleBasedAnalysis(response: string): TaskAnalysisResult {
    const lines = response.split('\n').filter(line => line.trim().length > 0);
    const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    // Action words that indicate tasks
    const actionWords = [
      'create', 'build', 'implement', 'research', 'investigate', 'design', 'develop', 
      'write', 'plan', 'organize', 'setup', 'configure', 'test', 'analyze', 'review',
      'prepare', 'schedule', 'send', 'meet', 'call', 'email', 'draft', 'finalize',
      'launch', 'deploy', 'publish', 'submit', 'complete', 'finish', 'start'
    ];

    // Detect multiple steps
    const stepIndicators = [
      /first\s+(.+?)(?:,|\.|then)/i,
      /then\s+(.+?)(?:,|\.|next)/i,
      /next\s+(.+?)(?:,|\.|finally)/i,
      /finally\s+(.+?)(?:,|\.|$)/i,
      /step\s*\d+[:\s]+(.+?)(?:,|\.|$)/i,
      /^\d+[\.\)]\s+(.+?)(?:,|\.|$)/gm,
      /^[-•*]\s+(.+?)(?:,|\.|$)/gm
    ];

    let detectedSteps: string[] = [];
    let mainTask = '';

    // Check for numbered or bulleted lists
    const bulletPoints = response.match(/^[-•*]\s+(.+?)(?:\n|$)/gm);
    const numberedPoints = response.match(/^\d+[\.\)]\s+(.+?)(?:\n|$)/gm);
    
    if (bulletPoints && bulletPoints.length > 1) {
      detectedSteps = bulletPoints.map(point => point.replace(/^[-•*]\s+/, '').trim());
      mainTask = this.extractMainTask(response, detectedSteps);
    } else if (numberedPoints && numberedPoints.length > 1) {
      detectedSteps = numberedPoints.map(point => point.replace(/^\d+[\.\)]\s+/, '').trim());
      mainTask = this.extractMainTask(response, detectedSteps);
    } else {
      // Check for step indicators
      for (const indicator of stepIndicators) {
        const matches = response.match(indicator);
        if (matches && matches.length > 1) {
          detectedSteps.push(...matches.slice(1).map(m => m.trim()));
        }
      }

      // If no clear steps found, check for multiple action sentences
      const actionSentences = sentences.filter(sentence => {
        const lowerSentence = sentence.toLowerCase();
        return actionWords.some(word => lowerSentence.includes(word)) ||
               /^(you should|try to|consider|make sure to|don't forget to)/i.test(sentence.trim());
      });

      if (actionSentences.length > 1) {
        detectedSteps = actionSentences.map(s => s.trim());
        mainTask = this.extractMainTask(response, detectedSteps);
      } else if (actionSentences.length === 1) {
        mainTask = actionSentences[0].trim();
      }
    }

    // Determine priority and category
    const priority = this.determinePriority(response);
    const category = this.determineCategory(response);

    return {
      structure: {
        mainTask: mainTask || 'Task from AI response',
        subtasks: detectedSteps,
        confidence: detectedSteps.length > 0 ? 0.8 : 0.6,
        reasoning: detectedSteps.length > 0 
          ? `Detected ${detectedSteps.length} distinct steps using rule-based analysis`
          : 'Single task detected using rule-based analysis'
      },
      shouldCreateSubtasks: detectedSteps.length > 0,
      priority,
      category
    };
  }

  /**
   * Extract main task from response when subtasks are detected
   */
  private extractMainTask(response: string, subtasks: string[]): string {
    // Try to find a high-level summary in the first sentence
    const firstSentence = response.split(/[.!?]/)[0].trim();
    
    // If first sentence seems like a summary, use it
    if (firstSentence.length > 10 && firstSentence.length < 100) {
      const lowerFirst = firstSentence.toLowerCase();
      const hasSummaryWords = /^(to|for|in order to|the goal is to|we need to)/i.test(lowerFirst);
      
      if (hasSummaryWords || !subtasks.some(subtask => firstSentence.toLowerCase().includes(subtask.toLowerCase()))) {
        return firstSentence;
      }
    }

    // Otherwise, create a summary from the subtasks
    const commonWords = this.findCommonWords(subtasks);
    if (commonWords.length > 0) {
      return `Complete ${commonWords.join(' ')} tasks`;
    }

    return 'Task from AI response';
  }

  /**
   * Find common words across subtasks to create a main task
   */
  private findCommonWords(subtasks: string[]): string[] {
    if (subtasks.length === 0) return [];

    const words = subtasks.map(task => 
      task.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3)
    );

    const commonWords = words[0].filter(word => 
      words.every(taskWords => taskWords.includes(word))
    );

    return commonWords.slice(0, 2); // Limit to 2 most common words
  }

  /**
   * Determine priority based on response content
   */
  private determinePriority(response: string): 'low' | 'medium' | 'high' {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('urgent') || lowerResponse.includes('critical') || 
        lowerResponse.includes('important') || lowerResponse.includes('asap') ||
        lowerResponse.includes('deadline')) {
      return 'high';
    }
    
    if (lowerResponse.includes('consider') || lowerResponse.includes('might') || 
        lowerResponse.includes('optional') || lowerResponse.includes('if possible')) {
      return 'low';
    }
    
    return 'medium';
  }

  /**
   * Determine category based on response content
   */
  private determineCategory(response: string): string {
    const lowerResponse = response.toLowerCase();
    
    if (lowerResponse.includes('work') || lowerResponse.includes('project') || 
        lowerResponse.includes('business') || lowerResponse.includes('client') ||
        lowerResponse.includes('meeting') || lowerResponse.includes('presentation')) {
      return 'Work';
    }
    
    if (lowerResponse.includes('health') || lowerResponse.includes('exercise') || 
        lowerResponse.includes('diet') || lowerResponse.includes('medical')) {
      return 'Health';
    }
    
    if (lowerResponse.includes('learn') || lowerResponse.includes('study') || 
        lowerResponse.includes('course') || lowerResponse.includes('education')) {
      return 'Learning';
    }
    
    if (lowerResponse.includes('finance') || lowerResponse.includes('money') || 
        lowerResponse.includes('budget') || lowerResponse.includes('investment')) {
      return 'Finance';
    }
    
    if (lowerResponse.includes('home') || lowerResponse.includes('house') || 
        lowerResponse.includes('clean') || lowerResponse.includes('repair')) {
      return 'Home';
    }
    
    if (lowerResponse.includes('travel') || lowerResponse.includes('trip') || 
        lowerResponse.includes('vacation') || lowerResponse.includes('booking')) {
      return 'Travel';
    }
    
    if (lowerResponse.includes('personal') || lowerResponse.includes('family') || 
        lowerResponse.includes('friend') || lowerResponse.includes('relationship')) {
      return 'Personal';
    }
    
    return 'General';
  }
}

export const taskStructureAnalyzer = TaskStructureAnalyzer.getInstance(); 