## 🎯 Technical Implementation Roadmap - Ready to Ship!

Excellent collaborative analysis everyone! @greptile-apps[bot] has identified the specific technical issues that need resolution. Here's a concrete implementation plan to get this feature working:

### 🚨 **Critical Issues to Address:**

**1. Semantic Clarity for `{context}`**
- **Issue**: Current impl sums input + output tokens, but `{context}` should show context window usage
- **Fix**: Use only `input_tokens` for `{context}`, or rename to `{totalTokens}` if total usage is intended
- **Recommendation**: Keep `{context}` for input tokens, add `{totalTokens}` if both are needed

**2. Fix `contextPercent` Denominator**
- **Issue**: Using `max_tokens` (output limit) instead of context window size
- **Fix**: Use model-specific context window size (e.g., 200k for Claude-3.5-Sonnet)
- **Implementation**: Create model → context size mapping

**3. Proper TypeScript Types**
```typescript
// Replace `usage: any` with:
type TokenUsage = {
  input_tokens?: number;
  prompt_tokens?: number;   // OpenAI
  output_tokens?: number;
  completion_tokens?: number; // OpenAI
};
```

**4. Complete the Data Pipeline**
The template logic is solid - need to wire actual usage data:

```typescript
// In inference response handler:
const onTokenUsage = (usage: TokenUsage, modelContextSize: number) => {
  const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
  const totalTokens = inputTokens + (usage.output_tokens || usage.completion_tokens || 0);
  
  prefixContext.context = inputTokens >= 1000 ? `${Math.round(inputTokens/1000)}k` : inputTokens.toString();
  prefixContext.contextPercent = Math.round((inputTokens / modelContextSize) * 100).toString();
  // Optionally add totalTokens field for total usage
};
```

### ✅ **Immediate Action Items:**

1. **Locate inference response processing** - Find where API responses are handled
2. **Add model context size mapping** - Create constants for context window sizes
3. **Wire usage data pipeline** - Call `onTokenUsage` alongside `onModelSelected`
4. **Update test coverage** - Include new variables in "all variables" test case
5. **Semantic decision** - Clarify whether `{context}` shows input tokens or total tokens

### 🚀 **Ready to Help Implement**

@JASSBR Would you like me to:
- Help locate the exact integration points in the inference pipeline?
- Create the model context size mapping constants?
- Provide a working patch for the data population logic?
- Update the test cases to match the final implementation?

**This is a great feature that just needs the data pipeline completed!** The template resolution logic is already solid. 💪

*Thanks to all reviewers for the excellent technical analysis - this collaborative debugging approach is exactly how great OSS projects work!* 🙌