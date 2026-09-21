# 六爻确定性算法服务

安装后启动：

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app:app --reload --port 8000
```

然后在项目根目录 `.env.local` 设置：

```env
PYTHON_ALGORITHM_BASE_URL=http://127.0.0.1:8000
```

算法规则：六爻数组均为初爻到上爻；数字法的第一、二个数字分别决定上、下卦，按模八映射，第三数字（若有）决定动爻，否则用前两个数字之和决定动爻。互卦取本卦第 2–4 爻为下互卦、第 3–5 爻为上互卦。动爻翻转阴阳得到变卦。
