#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Быстрый фикс - добавляет _gc_browser
"""

import sys
import os
from datetime import datetime

def fix_gc_browser(bot_path: str):
    if not os.path.exists(bot_path):
        print(f"❌ Файл не найден: {bot_path}")
        return False
    
    with open(bot_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Проверяем есть ли уже переменная
    if "_gc_browser: Optional[GetContactBrowser] = None" in content:
        print("✅ _gc_browser уже есть в коде")
        return True
    
    if "_gc_browser = None" in content:
        print("✅ _gc_browser уже есть в коде")
        return True
    
    # Бэкап
    backup_path = f"{bot_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Бэкап: {backup_path}")
    
    # Ищем функцию get_gc_browser и добавляем переменную перед ней
    gc_browser_code = '''
# GetContact singleton
_gc_browser: Optional[GetContactBrowser] = None


def get_gc_browser() -> GetContactBrowser:
'''
    
    # Вариант 1: ищем def get_gc_browser
    pos = content.find("def get_gc_browser()")
    if pos != -1:
        # Проверяем что перед ней нет _gc_browser
        before = content[max(0, pos-200):pos]
        if "_gc_browser" not in before:
            content = content[:pos] + "# GetContact singleton\n_gc_browser: Optional[GetContactBrowser] = None\n\n\n" + content[pos:]
            print("✅ Добавлена переменная _gc_browser")
        else:
            print("⚠️ _gc_browser уже есть рядом с get_gc_browser")
    else:
        print("⚠️ Функция get_gc_browser не найдена")
        return False
    
    # Сохраняем
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    # Проверяем синтаксис
    try:
        compile(content, bot_path, 'exec')
        print("✅ Синтаксис OK")
        return True
    except SyntaxError as e:
        print(f"❌ Ошибка синтаксиса: {e}")
        # Восстанавливаем
        with open(bot_path, 'w', encoding='utf-8') as f:
            with open(backup_path, 'r', encoding='utf-8') as bf:
                f.write(bf.read())
        print("   Восстановлен бэкап")
        return False


def main():
    print("=" * 50)
    print("🔧 Фикс _gc_browser")
    print("=" * 50)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}")
    
    if fix_gc_browser(bot_path):
        print("\n✅ ГОТОВО! Перезапустите бота")
    else:
        print("\n❌ Не удалось исправить")


if __name__ == "__main__":
    main()
