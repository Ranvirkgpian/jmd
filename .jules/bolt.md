
## 2024-05-22 - Context Data Structure Inefficiency
**Learning:** The `BillContext` exposes raw arrays (`customers`, `bills`) leading to O(n*m) complexity in consumer components when joining data (e.g., finding customer for each bill in a list).
**Action:** Always check if context data needs to be indexed (Map/Set) for O(1) access in list views, or provide helper methods/derived state in the context itself.
