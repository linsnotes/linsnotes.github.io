---
layout: post
title: Dunder Methods in Python
date: 2025-06-11 12:00:00 +0800
published: true #false or true
categories: python
toc: true
media_subpath: /assets/media/2025/dunder-methods-in-python
image: dunber.jpg
tags: [dunber, class]
---

## 🤔 What Are Dunder Methods?

Dunder methods are special functions that have **double underscores** before and after their names, like:

```python
__init__, __str__, __repr__, __eq__, __len__ ...
```

“Dunder” means **“double underscore”**. These methods are not magic — they are Python’s way of saying:

> “If you want your object to work with `print()`, `==`, `len()`, `for`, etc., then define this method.”

---

## 🔄 The Core Idea

> **When you use normal Python code**, like `print(obj)` or `obj == other`,
> Python checks:
> *"Does this object have a special method that tells me how to do this?"*

It automatically looks for a dunder method to use — for example:

* `print(obj)` → Python tries `obj.__str__()`
* `obj == other` → Python tries `obj.__eq__(other)`
* `len(obj)` → Python tries `obj.__len__()`

These methods **connect your object to Python’s built-in behavior**.

---

## 🧱 Let’s Build a Simple Class

```python
class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age
```

This creates a Dog object with a name and age.

Now let’s add dunder methods one at a time.

---

## 1. `__str__`: Friendly Display

```python
    def __str__(self):
        return f"{self.name}, {self.age} years old"
```

**What it does:**
Used when you do `print(dog)` — gives a nice, human-readable output.

---

## 2. `__repr__`: Debugging Output

```python
    def __repr__(self):
        return f"Dog('{self.name}', {self.age})"
```

**What it does:**
Used in debugging, lists, shell — shows how the object is built.

---

## 3. `__eq__`: Compare by Value

```python
    def __eq__(self, other):
        return self.name == other.name and self.age == other.age
```

**What it does:**
Lets `dog1 == dog2` work based on their values, not memory location.

---

## 4. `__len__`: Custom Length

```python
    def __len__(self):
        return self.age
```

**What it does:**
Lets you use `len(dog)` — maybe to represent dog’s age.

---

## 5. `__call__`: Act Like a Function

```python
    def __call__(self):
        print(f"{self.name} says woof!")
```

**What it does:**
Lets you write `dog()` like calling a function.

---

## ✅ Full Class Together

```python
class Dog:
    def __init__(self, name, age):
        self.name = name
        self.age = age

    def __str__(self):
        return f"{self.name}, {self.age} years old"

    def __repr__(self):
        return f"Dog('{self.name}', {self.age})"

    def __eq__(self, other):
        return self.name == other.name and self.age == other.age

    def __len__(self):
        return self.age

    def __call__(self):
        print(f"{self.name} says woof!")
```

---

## 🧠 Summary Table

| Python Code       | What It Does                   | Dunder Method Behind It |
| ----------------- | ------------------------------ | ----------------------- |
| `Dog("Buddy", 5)` | Creates object                 | `__init__`              |
| `print(dog)`      | Friendly string                | `__str__`               |
| `dog == other`    | Compare values                 | `__eq__`                |
| `len(dog)`        | Custom length                  | `__len__`               |
| `dog()`           | Makes object callable          | `__call__`              |
| `print([dog])`    | Shows object in debug/log form | `__repr__`              |

---

## 🪄 Final Advice for Beginners

* Start with just `__init__` and `__str__`. Then add more as you need them.
* Think: **“What does this object need to do?”** and then see if there’s a dunder method for it.
* Don’t memorize them — just understand the pattern:
  Python uses your methods automatically if you name them correctly.
