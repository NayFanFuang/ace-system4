import json

with open('frontend/poSystemSeed.js', encoding='utf-8') as f:
    content = f.read()

start = content.index('[')
depth = 0
i = start
in_str = False
prev_ch = ''
for idx, ch in enumerate(content[start:], start):
    if in_str:
        if ch == '"' and prev_ch != '\\':
            in_str = False
    else:
        if ch == '"':
            in_str = True
        elif ch == '[':
            depth += 1
        elif ch == ']':
            depth -= 1
            if depth == 0:
                i = idx
                break
    prev_ch = ch

arr_str = content[start:i+1]
data = json.loads(arr_str)

with open('po_seed.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'Total: {len(data)}')
print(f'Keys: {list(data[0].keys())}')
wt = {k: sum(1 for r in data if r.get("workType") == k) for k in ["SSV", "PAC"]}
print(f'workType: {wt}')
pc = {}
for r in data:
    k = r.get("systemProjectCode") or "NONE"
    pc[k] = pc.get(k, 0) + 1
print(f'systemProjectCode: {pc}')
print()
print('Sample row:', json.dumps(data[0], indent=2))
