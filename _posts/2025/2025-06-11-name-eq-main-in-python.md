---
layout: post
title: 'if __name__ == "__main__" in Python'
date: 2025-06-11 13:00:00 +0800
published: true #false or true
categories: python
toc: true
media_subpath: /assets/media/2025/name-main-in-python
image: module-main.jpg
tags: [main, module]
---



## ✅ Quick Example First

```python
def add(a, b):
    return a + b

def test():
    print("Testing add:", add(2, 3))

if __name__ == "__main__":
    test()
```

### What happens?

* Run this file → Output: `Testing add: 5` ✅
* Import this file in another script → Output: *(nothing)* ❌
  But you can still call `add()` from the other file.

---

## 🤔 What Is `__name__ == "__main__"`?

This is a special line in Python that lets your file **run code only when executed directly**, not when imported by another file.

It's not a function. It's not magic. It's just a **check**.

---

## 🔄 The Core Idea

When you run a Python file, Python automatically sets a built-in variable called `__name__`.

Then it does this:

| Situation                                 | What `__name__` becomes    |
| ----------------------------------------- | -------------------------- |
| You **run** the file directly             | `"__main__"`               |
| You **import** the file in another script | The file's **module name** |

### ✅ What does `"__main__"` mean?

It means **“this is the starting point of the program”**.
When Python sets `__name__ = "__main__"`, it’s marking this file as the one that was executed, not imported.

---

## 🔍 Behind the Scenes

When Python starts running the file, it sets:

```python
__name__ = "__main__"
```

But when the file is **imported**, it sets:

```python
__name__ = "filename"
```

---

## 🧱 Why Use This?

| Use Case                        | Why It’s Useful                                         |
| ------------------------------- | ------------------------------------------------------- |
| ✅ Writing reusable modules      | Code won't auto-run when imported elsewhere             |
| ✅ Testing functions in the file | You can run it to test, but keep it clean when imported |
| ✅ Keeping your code organized   | Keeps script logic separate from definitions            |

---

## 🧠 Summary Table

| What You Do                   | What Python Sets `__name__` To | What Runs?                              |
| ----------------------------- | ------------------------------ | --------------------------------------- |
| Run file directly             | `"__main__"`                   | Code under `if __name__` runs ✅         |
| Import file from another file | `"module_name"`                | Code under `if __name__` does NOT run ❌ |

---

## 🪄 Final Advice for Beginners

* Always use `if __name__ == "__main__"` to keep your code clean and reusable.
* Think of it like a **“main entry point”** for your program.
* Great for testing parts of your code without triggering them on import.
