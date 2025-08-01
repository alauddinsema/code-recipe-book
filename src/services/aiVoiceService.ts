// AI-Enhanced Voice Service for PantryAI
// Combines Web Speech API with Gemini AI for natural language understanding

import { VoiceService } from './voiceService';
import type { VoiceSettings } from './voiceService';

export interface AIVoiceCommand {
  originalText: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  action: string;
  parameters?: Record<string, any>;
  response?: string;
}

export interface CookingContext {
  currentRecipe?: any;
  currentStep?: number;
  totalSteps?: number;
  activeTimers?: any[];
  pantryItems?: string[];
  groceryList?: any[];
  cookingMode?: 'prep' | 'cooking' | 'cleanup';
}

export class AIVoiceService extends VoiceService {
  // TODO: Add Gemini service integration
  private cookingContext: CookingContext = {};
  private conversationHistory: string[] = [];
  private isAIMode = true;

  // Enhanced AI-powered command patterns
  // TODO: Use these prompts when Gemini AI is integrated
  private readonly AI_VOICE_PROMPTS = {
    COMMAND_ANALYSIS: `
You are PantryAI's voice assistant for cooking. Analyze this voice command and respond with a JSON object.

COOKING CONTEXT:
- Current Recipe: {recipeName}
- Current Step: {currentStep} of {totalSteps}
- Active Timers: {activeTimers}
- Cooking Mode: {cookingMode}

USER SAID: "{userInput}"

Analyze the intent and respond with this JSON structure:
{
  "intent": "navigation|timer|information|control|grocery|pantry|recipe_search|cooking_tip",
  "action": "specific_action_to_take",
  "parameters": {"key": "value"},
  "confidence": 0.95,
  "response": "Natural response to speak back",
  "entities": {"ingredient": "tomato", "time": "5 minutes", "step": 3}
}

SUPPORTED INTENTS:
- navigation: next_step, previous_step, go_to_step, repeat_step
- timer: set_timer, check_timer, cancel_timer, pause_timer
- information: read_ingredients, cooking_time, servings, nutrition
- control: pause_cooking, resume_cooking, exit_cooking, volume_control
- grocery: add_to_grocery_list, check_grocery_list, suggest_substitutes
- pantry: check_pantry, add_to_pantry, suggest_recipes_from_pantry
- recipe_search: find_recipe, suggest_recipe, filter_recipes
- cooking_tip: cooking_advice, technique_help, troubleshooting

Examples:
"What's next?" → {"intent": "navigation", "action": "next_step"}
"Set a timer for the pasta" → {"intent": "timer", "action": "set_timer", "parameters": {"duration": "8-12 minutes", "label": "pasta"}}
"Do I have tomatoes?" → {"intent": "pantry", "action": "check_pantry", "entities": {"ingredient": "tomatoes"}}
"How do I know when it's done?" → {"intent": "cooking_tip", "action": "cooking_advice"}
`,

    COOKING_ASSISTANT: `
You are PantryAI's cooking assistant. The user is cooking and needs help. 
Provide helpful, concise cooking advice in a conversational tone.

CONTEXT: {context}
USER QUESTION: "{question}"

Respond naturally as if you're a helpful cooking companion. Keep responses under 50 words for voice.
`,

    RECIPE_SEARCH: `
Help the user find recipes based on their voice request.

AVAILABLE RECIPES: {availableRecipes}
USER REQUEST: "{request}"

Suggest 1-3 most relevant recipes and explain why they match. Keep response conversational and under 60 words.
`,

    INGREDIENT_SUBSTITUTION: `
The user is cooking and needs ingredient substitutions.

RECIPE: {recipeName}
MISSING INGREDIENT: {ingredient}
PANTRY ITEMS: {pantryItems}

Suggest the best substitution from their pantry or common alternatives. Explain the ratio and any cooking adjustments needed.
Keep response under 40 words for voice.
`
  };

  constructor(_settings?: Partial<VoiceSettings>) {
    super();
    this.setupAIVoiceCommands();
    // Initialize AI prompts for future use
    console.log('AI Voice Service initialized with', Object.keys(this.AI_VOICE_PROMPTS).length, 'prompt templates');
  }

  /**
   * Setup AI-enhanced voice command processing
   */
  private setupAIVoiceCommands(): void {
    // Override the parent's command processing with AI
    this.registerCommand('*', async (params?: any) => {
      if (params && typeof params === 'string') {
        // Handle string transcript
        await this.processAICommand(params, 1.0);
      } else if (params && params.transcript) {
        // Handle object with transcript and confidence
        await this.processAICommand(params.transcript, params.confidence || 1.0);
      }
    });
  }

  /**
   * Process voice command using AI understanding
   */
  private async processAICommand(transcript: string, _confidence: number): Promise<void> {
    try {
      console.log(`🤖 Processing AI voice command: "${transcript}"`);

      // TODO: Build context for AI when Gemini is integrated
      console.log('Current cooking context:', this.cookingContext);

      // TODO: Get AI analysis of the command when Gemini is integrated

      // TODO: Implement AI analysis with Gemini
      // For now, use simple pattern matching
      const aiResponse = this.analyzeCommandLocally(transcript);
      const aiCommand = this.parseAIResponse(aiResponse);

      if (aiCommand && aiCommand.confidence > 0.7) {
        await this.executeAICommand(aiCommand);
      } else {
        await this.handleUnknownCommand(transcript);
      }

      // Add to conversation history
      this.conversationHistory.push(`User: ${transcript}`);
      this.conversationHistory.push(`AI: ${aiCommand?.response || 'Command processed'}`);
      
      // Keep only last 10 exchanges
      if (this.conversationHistory.length > 20) {
        this.conversationHistory = this.conversationHistory.slice(-20);
      }

    } catch (error) {
      console.error('AI voice processing error:', error);
      this.handleTraditionalCommand(transcript);
    }
  }

  /**
   * Execute AI-analyzed command
   */
  private async executeAICommand(aiCommand: AIVoiceCommand): Promise<void> {
    console.log(`🎯 Executing AI command:`, aiCommand);

    switch (aiCommand.intent) {
      case 'navigation':
        await this.handleNavigationCommand(aiCommand);
        break;
      case 'timer':
        await this.handleTimerCommand(aiCommand);
        break;
      case 'information':
        await this.handleInformationCommand(aiCommand);
        break;
      case 'grocery':
        await this.handleGroceryCommand(aiCommand);
        break;
      case 'pantry':
        await this.handlePantryCommand(aiCommand);
        break;
      case 'recipe_search':
        await this.handleRecipeSearchCommand(aiCommand);
        break;
      case 'cooking_tip':
        await this.handleCookingTipCommand(aiCommand);
        break;
      default:
        await this.handleControlCommand(aiCommand);
    }

    // Speak the AI response
    if (aiCommand.response) {
      await this.speak(aiCommand.response);
    }
  }

  /**
   * Handle cooking tips and advice
   */
  private async handleCookingTipCommand(aiCommand: AIVoiceCommand): Promise<void> {
    const context = this.buildContextString();
    // TODO: Use AI_VOICE_PROMPTS.COOKING_ASSISTANT when Gemini AI is integrated
    console.log('Cooking tip context:', context, 'Question:', aiCommand.originalText);

    try {
      // TODO: Implement Gemini AI integration for cooking tips
      const advice = "Here's a helpful cooking tip: Always taste as you go and adjust seasonings accordingly.";
      await this.speak(advice);
    } catch (error) {
      await this.speak("I'm having trouble accessing cooking tips right now. Try asking about specific techniques or ingredients.");
    }
  }

  /**
   * Handle pantry-related commands
   */
  private async handlePantryCommand(aiCommand: AIVoiceCommand): Promise<void> {
    const { action, entities } = aiCommand;

    switch (action) {
      case 'check_pantry':
        if (entities.ingredient) {
          // Check if ingredient is in pantry
          const hasIngredient = this.cookingContext.pantryItems?.includes(entities.ingredient.toLowerCase());
          const response = hasIngredient 
            ? `Yes, you have ${entities.ingredient} in your pantry.`
            : `No, you don't have ${entities.ingredient}. Should I add it to your grocery list?`;
          await this.speak(response);
        }
        break;
      case 'suggest_recipes_from_pantry':
        await this.speak("Let me find recipes you can make with your pantry items.");
        // Trigger pantry-based recipe search
        console.log('Triggering pantry-based recipe search');
        break;
    }
  }

  /**
   * Handle grocery list commands
   */
  private async handleGroceryCommand(aiCommand: AIVoiceCommand): Promise<void> {
    const { action, entities } = aiCommand;

    switch (action) {
      case 'add_to_grocery_list':
        if (entities.ingredient) {
          await this.speak(`Adding ${entities.ingredient} to your grocery list.`);
          console.log('Adding to grocery list:', entities.ingredient);
        }
        break;
      case 'suggest_substitutes':
        if (entities.ingredient) {
          await this.handleIngredientSubstitution(entities.ingredient);
        }
        break;
    }
  }

  /**
   * Handle ingredient substitution requests
   */
  private async handleIngredientSubstitution(ingredient: string): Promise<void> {
    // TODO: Use AI_VOICE_PROMPTS.INGREDIENT_SUBSTITUTION when Gemini AI is integrated
    console.log('Ingredient substitution for:', ingredient, 'Recipe:', this.cookingContext.currentRecipe?.title);

    try {
      // TODO: Implement Gemini AI integration for ingredient substitution
      const substitution = `For ${ingredient}, you can try using similar ingredients from your pantry. Check cooking guides for specific ratios.`;
      await this.speak(substitution);
    } catch (error) {
      await this.speak(`For ${ingredient}, you can usually substitute with similar ingredients. Check online for specific ratios.`);
    }
  }

  /**
   * Parse AI response into structured command
   */
  private parseAIResponse(response: string): AIVoiceCommand | null {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        originalText: '',
        intent: parsed.intent,
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.5,
        action: parsed.action,
        parameters: parsed.parameters,
        response: parsed.response
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return null;
    }
  }

  /**
   * Build context string for AI
   */
  private buildContextString(): string {
    return JSON.stringify({
      recipe: this.cookingContext.currentRecipe?.title,
      step: this.cookingContext.currentStep,
      totalSteps: this.cookingContext.totalSteps,
      timers: this.cookingContext.activeTimers,
      mode: this.cookingContext.cookingMode,
      recentConversation: this.conversationHistory.slice(-6)
    });
  }

  /**
   * Update cooking context
   */
  public updateCookingContext(context: Partial<CookingContext>): void {
    this.cookingContext = { ...this.cookingContext, ...context };
  }

  /**
   * Toggle between AI mode and basic mode
   */
  public toggleAIMode(): void {
    this.isAIMode = !this.isAIMode;
    const mode = this.isAIMode ? 'AI-enhanced' : 'basic';
    this.speak(`Switched to ${mode} voice commands.`);
  }

  /**
   * Get conversation history
   */
  public getConversationHistory(): string[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  public clearConversationHistory(): void {
    this.conversationHistory = [];
  }

  // Missing method implementations
  private analyzeCommandLocally(_transcript: string): any {
    return {
      intent: 'unknown',
      confidence: 0.5,
      response: 'Command processed'
    };
  }

  private handleTraditionalCommand(transcript: string): void {
    console.log('Handling traditional command:', transcript);
    // Use parent class command processing
    this.speak('Command received');
  }

  private async handleNavigationCommand(aiCommand: AIVoiceCommand): Promise<void> {
    console.log('Navigation command:', aiCommand);
    this.speak('Navigation command processed');
  }

  private async handleTimerCommand(aiCommand: AIVoiceCommand): Promise<void> {
    console.log('Timer command:', aiCommand);
    this.speak('Timer command processed');
  }

  private async handleInformationCommand(aiCommand: AIVoiceCommand): Promise<void> {
    console.log('Information command:', aiCommand);
    this.speak('Information command processed');
  }

  private async handleRecipeSearchCommand(aiCommand: AIVoiceCommand): Promise<void> {
    console.log('Recipe search command:', aiCommand);
    this.speak('Recipe search command processed');
  }

  private async handleControlCommand(aiCommand: AIVoiceCommand): Promise<void> {
    console.log('Control command:', aiCommand);
    this.speak('Control command processed');
  }

  private async handleUnknownCommand(transcript: string): Promise<void> {
    console.log('Unknown command:', transcript);
    this.speak('Sorry, I did not understand that command');
  }

  // Add getter methods for compatibility
  public getIsListening(): boolean {
    return this.isCurrentlyListening();
  }

  public getIsSpeaking(): boolean {
    // Simple implementation - check if synthesis is speaking
    return false; // TODO: Implement proper speaking state tracking
  }
}

// Export singleton instance
export const aiVoiceService = new AIVoiceService();
