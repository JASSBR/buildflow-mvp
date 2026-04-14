# 🎯 Updated Implementation Following Greptile Feedback

Excellent detailed feedback @greptile-apps! You're absolutely right on all 4 points. Here's the updated implementation approach that follows OpenClaw's existing patterns:

## ✅ 1. Use Existing `UsageLike` Interface

**Before:** Creating duplicate `TokenUsageInfo` interface
**After:** Leverage existing `UsageLike` from `src/agents/usage.ts`

```typescript
import { normalizeUsage, type UsageLike } from "../agents/usage.js";

// In the template variable population
const normalized = normalizeUsage(response.usage);
const inputTokens = normalized?.input ?? 0;
const contextPercent = contextWindowSize > 0 ? Math.round((inputTokens / contextWindowSize) * 100) : 0;
```

## ✅ 2. Leverage Existing Context Window Metadata 

**Before:** Hardcoded `MODEL_CONTEXT_SIZES` registry
**After:** Use existing context window data from `ModelSelectionContext`

```typescript
// In onModelSelected, capture context window size
let contextWindowSize = 0;

onModelSelected: (modelId: string, context: ModelSelectionContext) => {
  // Extract context window from model config rather than static lookup
  contextWindowSize = context.contextWindow || context.model?.contextSize || 0;
  
  prefixContext.modelName = modelId;
}
```

## ✅ 3. Correct Timing Semantics - Previous Turn's Usage

**Key Insight:** Response prefix shows *previous turn's* context state, not current turn's (which isn't available yet).

**Updated JSDoc and Documentation:**
```typescript
/**
 * Template variables for response prefix:
 * 
 * {context} - Input tokens from PREVIOUS turn (prompt tokens sent to model)
 * {contextPercent} - Percentage of context window used by previous turn's input
 * 
 * Note: Shows previous turn's usage because response prefix is generated BEFORE
 * the current API response completes. This gives users visibility into context
 * pressure going INTO the current request.
 */
```

## ✅ 4. Wire as `onUsageReceived` Callback Pattern

**Updated `ReplyPrefixContextBundle`:**
```typescript
export type ReplyPrefixContextBundle = {
  // ... existing fields
  onModelSelected: (modelId: string, context: ModelSelectionContext) => void;
  onUsageReceived: (usage: UsageLike, contextWindowSize?: number) => void;
};
```

**Implementation in reply generation:**
```typescript
// When usage data arrives from API response
if (response.usage && bundle.onUsageReceived) {
  bundle.onUsageReceived(response.usage, contextWindowSize);
}
```

**Template variable population in `onUsageReceived`:**
```typescript
onUsageReceived: (usage: UsageLike, contextWindowSize = 0) => {
  const normalized = normalizeUsage(usage);
  const inputTokens = normalized?.input ?? 0;
  const contextPercent = contextWindowSize > 0 ? Math.round((inputTokens / contextWindowSize) * 100) : 0;
  
  // Update prefixContext for NEXT turn's response prefix
  prefixContext.context = inputTokens.toLocaleString();
  prefixContext.contextPercent = `${contextPercent}%`;
}
```

## 🔧 Complete Integration Pattern

**Where callers wire both callbacks:**
```typescript
const bundle: ReplyPrefixContextBundle = {
  prefixContext,
  
  onModelSelected: (modelId: string, context: ModelSelectionContext) => {
    contextWindowSize = context.contextWindow || context.model?.contextSize || 0;
    prefixContext.modelName = modelId;
  },
  
  onUsageReceived: (usage: UsageLike, contextWindowSize = 0) => {
    const normalized = normalizeUsage(usage);
    const inputTokens = normalized?.input ?? 0;
    const contextPercent = contextWindowSize > 0 ? Math.round((inputTokens / contextWindowSize) * 100) : 0;
    
    prefixContext.context = inputTokens.toLocaleString();
    prefixContext.contextPercent = `${contextPercent}%`;
  }
};
```

## 📋 Updated File Changes Summary

**Files to modify:**
1. `src/agents/reply-prefix.ts` - Add `onUsageReceived` to `ReplyPrefixContextBundle`
2. **Existing usage integration points** - Wire `onUsageReceived` where `onModelSelected` is already wired
3. **Template variable docs** - Update to clarify "previous turn" semantics

**Files NOT needed:**
- ❌ No new interfaces (use existing `UsageLike`)
- ❌ No hardcoded model registries (use dynamic context window)
- ❌ No timing workarounds (embrace previous-turn semantics)

## 🚀 Benefits of This Approach

1. **Zero duplication** - Leverages existing `UsageLike` and `normalizeUsage`
2. **Dynamic context windows** - No maintenance burden for new models
3. **Clear semantics** - Users understand they're seeing "context going into this request"
4. **Consistent patterns** - Mirrors existing `onModelSelected` callback style
5. **Cross-provider compatibility** - Works with any provider supported by `normalizeUsage`

This implementation follows OpenClaw's established patterns while delivering the requested template variables in a maintainable way. Ready for implementation! 🦞

---

**Response to greptile-apps feedback points:**
✅ 1. Using `UsageLike` instead of custom interface  
✅ 2. Dynamic context window via `ModelSelectionContext`  
✅ 3. Documented previous-turn timing semantics  
✅ 4. Consistent `onUsageReceived` callback pattern