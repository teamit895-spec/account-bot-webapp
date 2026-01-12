#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔧 Фикс: объявление _gc_browser = None
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
    
    # Проверяем есть ли уже объявление
    if '_gc_browser: Optional[GetContactBrowser] = None' in content or '_gc_browser = None' in content:
        # Проверяем что оно НЕ внутри функции
        lines = content.split('\n')
        found_global = False
        for i, line in enumerate(lines):
            stripped = line.strip()
            if '_gc_browser' in stripped and '= None' in stripped:
                # Проверяем что это не внутри функции (без отступов или с минимальным)
                indent = len(line) - len(line.lstrip())
                if indent == 0:
                    found_global = True
                    break
        
        if found_global:
            print("✅ _gc_browser уже объявлен глобально")
            return True
    
    # Бэкап
    backup_path = f"{bot_path}.backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    with open(backup_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ Бэкап: {backup_path}")
    
    # Ищем класс GetContactBrowser и добавляем переменную после него
    class_end = content.find("class GetContactBrowser:")
    if class_end != -1:
        # Ищем конец класса (следующий class или def на уровне 0)
        lines = content[class_end:].split('\n')
        insert_pos = class_end
        for i, line in enumerate(lines[1:], 1):
            if line and not line.startswith(' ') and not line.startswith('\t'):
                if line.startswith('class ') or (line.startswith('def ') and not line.startswith('def ')):
                    insert_pos = class_end + sum(len(l) + 1 for l in lines[:i])
                    break
                elif line.startswith('#') or line.startswith('@'):
                    continue
                elif line.strip() and not line.startswith('#'):
                    insert_pos = class_end + sum(len(l) + 1 for l in lines[:i])
                    break
        
        # Ищем функцию get_gc_browser и вставляем перед ней
        func_pos = content.find("def get_gc_browser()")
        if func_pos != -1:
            # Вставляем объявление перед функцией
            insert_text = "\n# Глобальный экземпляр GetContact браузера\n_gc_browser: Optional[GetContactBrowser] = None\n\n"
            content = content[:func_pos] + insert_text + content[func_pos:]
            print("✅ Добавлено: _gc_browser = None (перед get_gc_browser)")
        else:
            print("⚠️ Функция get_gc_browser не найдена")
            return False
    else:
        print("⚠️ Класс GetContactBrowser не найден")
        return False
    
    with open(bot_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    try:
        compile(content, bot_path, 'exec')
        print("✅ Синтаксис OK")
        return True
    except SyntaxError as e:
        print(f"❌ Ошибка синтаксиса: {e}")
        # Восстановление
        with open(backup_path, 'r', encoding='utf-8') as f:
            with open(bot_path, 'w', encoding='utf-8') as bf:
                bf.write(f.read())
        print("🔄 Восстановлено из бэкапа")
        return False


def main():
    print("=" * 50)
    print("🔧 Фикс: _gc_browser = None")
    print("=" * 50)
    
    bot_path = sys.argv[1] if len(sys.argv) > 1 else "bot.py"
    print(f"📄 Файл: {bot_path}\n")
    
    if fix_gc_browser(bot_path):
        print("\n✅ ГОТОВО!")


if __name__ == "__main__":
    main()
