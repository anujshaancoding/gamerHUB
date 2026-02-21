# React Hooks Best Practices

This directory contains custom React hooks for the application. Follow these guidelines to prevent common hook-related bugs:

## useEffect Dependency Arrays

### ✅ DO:
```typescript
// Use eslint-disable when you're certain a dependency is stable
useEffect(() => {
  stableCallback();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [dependency]); // stableCallback is memoized and only depends on dependency
```

### ❌ DON'T:
```typescript
// Don't include callbacks that create circular dependencies
const fetchData = useCallback(async () => { ... }, [dep]);
useEffect(() => {
  fetchData();
}, [dep, fetchData]); // fetchData already depends on dep!
```

### ✅ DO:
```typescript
// Include only the primitive dependencies
const fetchData = useCallback(async () => { ... }, [dep]);
useEffect(() => {
  fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [dep]); // fetchData is stable when dep doesn't change
```

## Common Pitfalls

### 1. Object Dependencies
```typescript
// ❌ BAD: Creates new object every render
useEffect(() => {}, [{ id: 1 }]);

// ✅ GOOD: Use primitive values
const id = 1;
useEffect(() => {}, [id]);
```

### 2. Array Spreading in Dependencies
```typescript
// ❌ BAD: Array size can change
useEffect(() => {}, [...someArray]);

// ✅ GOOD: Use array length or specific indices
useEffect(() => {}, [someArray.length]);
```

### 3. Conditional Dependencies
```typescript
// ❌ BAD: Size changes based on condition
useEffect(() => {}, [a, ...(condition ? [b] : [])]);

// ✅ GOOD: Always include all dependencies
useEffect(() => {
  if (condition) {
    // use b
  }
}, [a, b, condition]);
```

## Stable References

These are guaranteed stable and don't need to be in dependency arrays:
- setState functions from useState
- dispatch from useReducer
- ref objects from useRef
- Functions wrapped in useCallback with stable deps

## Testing Hooks

Always test custom hooks with:
```bash
npm run lint        # Catch hook violations
npm run test        # Unit tests
```
