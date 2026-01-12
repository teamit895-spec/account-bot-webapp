#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
🔄 Конвертация Instagram аккаунтов в оптимальный формат
"""

# Desktop User-Agents (лучше для HTTP API)
DESKTOP_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
]

# Твои текущие аккаунты
CURRENT_ACCOUNTS = [
    "aboardcamel5l5za:FUptkXtkU8bMEO6LVG9U|Instagram 411.0.0.22.255 Android (30/11; 440dpi; 1080x2340; Oppo; S10; S10; oppoFindX; en_US; 856427437)|ds_user_id=80170871406;sessionid=80170871406%3At70IYmUKcDWDG6%3A24%3AAYjKxbbT9OnKbp6OqsO6Ne6CJJ9sRvO0OVImaXK3hQ;ig_did=052b31c5-f3bc-4d91-bc41-3b1ab742130f;mid=aWLVoQAAAAFWFk1ms_7YAnIecBJi;rur=EAG",
    "shamefulhoopoe5nq21:ZCILLZgC5W2iL95rMXiX|Instagram 411.0.0.22.255 Android (29/10; 480dpi; 720x1422; Samsung; Mate20; Mate20; oppoFindX; en_US; 856427437)|ds_user_id=80017196108;sessionid=80017196108%3AZ0GHlhSVfUSvLv%3A12%3AAYgGTw4h2y6eYi7JI-bheKbFMFoHk3LSN25wp6SBmg;ig_did=5a44a49e-bda4-4cc4-872d-2da1c15c6077;mid=aWLVnQAAAAGezjxjmfC318EZR3ok;rur=EAG",
    "pridefulstork9tdoe:t898agToBKrQZprC8PDw|Instagram 411.0.0.22.255 Android (29/10; 480dpi; 1080x2340; Samsung; P30; P30; eagle75v1; en_US; 856427437)|ds_user_id=80032123166;sessionid=80032123166%3ALkpgRJUZmxsaB1%3A18%3AAYitDtSTtwzSfrJSPzv6aAmBlndl2njkCUor0HYMhg;ig_did=23bfd142-6916-4f00-a798-b1b97594bd6e;mid=aWLVbgAAAAFIBL2zDHWl5wgfnBv7;rur=EAG",
    "insecuremackerel4mush:4fdSkbG9hoDc8hyZ9vjM|Instagram 411.0.0.22.255 Android (29/10; 440dpi; 1080x2340; Oppo; OnePlus6; OnePlus6; eagle75v1; en_US; 856427437)|ds_user_id=78190676299;sessionid=78190676299%3A9lGRkRe0Hw6z1M%3A1%3AAYg5GgaG_R5InUFJru7ps_VRyTo93e190wzl4WEgeQ;ig_did=9e40ea6a-2dbd-41fd-a4a8-f0227aa51d56;mid=aWLVegAAAAHMXcnSXkaj7SCuyIZz;rur=EAG",
    "jealousmoth066l4:5QrvubfwXqoSWdpwcpl2|Instagram 411.0.0.22.255 Android (36/16; 420dpi; 1440x2560; Samsung; H30-L02; H30-L02; eagle75v1; en_US; 856427437)|ds_user_id=79996134135;sessionid=79996134135%3AA79azktV8wIZS0%3A21%3AAYisWiRt1lbbYzt8Ei5wuIIz1IJoZHV_kjLdE91r_w;ig_did=c699a2ae-2c86-4ffd-8481-8a65164174aa;mid=aWLVtgAAAAGwHRfmaa6jDJUKDMGm;rur=EAG",
    "mellowtacos1w8va:hrNfGhPU3xC5KKkxecBh|Instagram 411.0.0.22.255 Android (36/16; 440dpi; 720x1280; Xiaomi; H30-L02; H30-L02; samsungexynos; en_US; 856427437)|ds_user_id=80171926848;sessionid=80171926848%3AFOmfMQ6AGszuMI%3A3%3AAYhWQCYDADYzcJqRi4jWv6924YuUfYl4cvDRP_eumg;ig_did=e71106a5-bb8e-4a6e-a7f9-f3d175976a0f;mid=aWLVsgAAAAEHkXAde9XqGrgqKYSy;rur=EAG",
    "wingedcheetah0klpa:T21TuBve9O5XVsyELq5E|Instagram 411.0.0.22.255 Android (30/11; 440dpi; 720x1422; Oppo; Mate20; Mate20; oppoFindX; en_US; 856427437)|ds_user_id=80403313230;sessionid=80403313230%3Ab98APw1PZNB9Wn%3A24%3AAYiy8_O8388dLon-ekTpxNnfSpAjsjgHLEZBV2pNlw;ig_did=b626d571-6845-4c0e-872b-bbc0b558a2b9;mid=aWLVoQAAAAEWGprZ4tXlE-02tF4-;rur=EAG",
    "debonairferret5p3yv:3Pnucwsq7rnWmascZBfP|Instagram 411.0.0.22.255 Android (30/11; 440dpi; 1080x1920; OnePlus; P30; P30; oppoFindX; en_US; 856427437)|ds_user_id=80021963892;sessionid=80021963892%3A9HV1ZTapPLfIkz%3A19%3AAYgJd77Eay_YXsr9HhUP-sVn-wluss9GChGdN8ulWg;ig_did=dc587d89-0b24-4ab6-b198-0a9187eb703b;mid=aWLVpgAAAAH-BoHIhfXdbY04wQth;rur=EAG",
    "dreadfultoucan1177k:ZKH7Eh7Vt9MSbAPaCPsG|Instagram 411.0.0.22.255 Android (28/9; 480dpi; 1080x2340; Huawei; S10; S10; oneplus6t; en_US; 856427437)|ds_user_id=78179195219;sessionid=78179195219%3Aeke5E7QZC92Ahe%3A20%3AAYjVSNcHE4RCgD80y1-UVtV0TD5l2OW7z9II7kvDtw;ig_did=ea6006b5-435b-406e-a684-3b57b28aa268;mid=aWLViwAAAAFTUGL3ZYyBa7Xz1d_L;rur=EAG",
    "morbidwhiting6tj68:ZvB2AUYrRlN6wW345ggc|Instagram 411.0.0.22.255 Android (30/11; 480dpi; 1080x2340; Huawei; P30; P30; kirin970; en_US; 856427437)|ds_user_id=78198404927;sessionid=78198404927%3A82B1NrzxLRCoZv%3A3%3AAYjftD1rKRIOx6vHBda5zuKZcMaEB7meu4uEAU_uSg;ig_did=cc512a1a-1f67-42dd-954c-b35cd3756846;mid=aWLVgwAAAAH3ivafz7m2KE48Vr88;rur=EAG",
    "cruelrice1ow91:cBc20cYg7WTTYOPF7wSW|Instagram 411.0.0.22.255 Android (28/9; 480dpi; 1080x2340; Xiaomi; S10; S10; samsungexynos; en_US; 856427437)|ds_user_id=80034058893;sessionid=80034058893%3AAMOa0H346cmqK3%3A19%3AAYiQMjASRANqp9PB70rMtz49srL4G97Vn_54p7fX2Q;ig_did=93276d24-34df-4174-9bdc-ac8febb27481;mid=aWLVlQAAAAG_jpVCRZp0rxkTWaEA;rur=EAG",
    "insecuremandrill66n1r:R8MzWRUwHgWrhlYIdZgT|Instagram 411.0.0.22.255 Android (28/9; 440dpi; 720x1280; Xiaomi; P30; P30; samsungexynos; en_US; 856427437)|ds_user_id=80194145639;sessionid=80194145639%3AU9dqamOnSKpWUk%3A2%3AAYhCotCtkMDcrxmLQ_qF6voq7RnjYxEbwarYXLOyVw;ig_did=4a79cbde-7cf8-4b05-bbd5-1054a1cb174b;mid=aWLV4QAAAAEPvOCAYJIz2X1jqIsW;rur=EAG",
    "worriedlion6qvwn:pA8W8V2q4UL4HlFRE6gK|Instagram 411.0.0.22.255 Android (28/9; 420dpi; 720x1280; Samsung; OnePlus6; OnePlus6; oppoFindX; en_US; 856427437)|ds_user_id=79878544127;sessionid=79878544127%3Ar9DQQ31nHSWuQj%3A28%3AAYi2m5ew3j61Nu30jA8Uwue37ErEa_utk12sKDkgWQ;ig_did=00eb4d85-7e21-41b1-ab6b-3ae4874be58f;mid=aWLV0AAAAAE4GzaYSuBOcQRt5AwK;rur=EAG",
    "debonairtruffle9gnhh:txBlmxouvlHjJatCZa3F|Instagram 411.0.0.22.255 Android (29/10; 480dpi; 720x1280; Xiaomi; Mate20; Mate20; oneplus6t; en_US; 856427437)|ds_user_id=80025915599;sessionid=80025915599%3AisaGF9ElY0xaT6%3A10%3AAYhD9yL8BYVVuTCrs7czyLBumym6y_f6saI4H3vyQw;ig_did=e80bb82a-b1c5-46e6-bd5b-f636a5eef486;mid=aWLVzwAAAAGLdA2qoRDjUz9jSGSt;rur=EAG",
    "adoringporpoise6g69t:jJQERIFbvwodNRmsKgWm|Instagram 411.0.0.22.255 Android (28/9; 480dpi; 1080x2340; OnePlus; Mate20; Mate20; oppoFindX; en_US; 856427437)|ds_user_id=80188074153;sessionid=80188074153%3AzAiOSOWio2kPNz%3A21%3AAYjXdLlZR6dccwVt1AaxYrjxcUAGQUOzxQ_Lhtx61A;ig_did=52bb83db-8d9e-42b9-a802-474a0def5f90;mid=aWLVqQAAAAEVXvY-l3uzmGUn1nFL;rur=EAG",
]


def convert_accounts():
    """Конвертировать аккаунты с Desktop User-Agent"""
    
    converted = []
    
    for i, acc in enumerate(CURRENT_ACCOUNTS):
        parts = acc.split("|")
        if len(parts) < 3:
            continue
        
        login_pass = parts[0]  # login:password
        cookies = parts[2]     # cookies
        
        # Выбираем Desktop User-Agent (ротация)
        ua = DESKTOP_USER_AGENTS[i % len(DESKTOP_USER_AGENTS)]
        
        # Собираем новый формат
        new_acc = f"{login_pass}|{ua}|{cookies}"
        converted.append(new_acc)
    
    return converted


def main():
    print("=" * 60)
    print("🔄 КОНВЕРТАЦИЯ INSTAGRAM АККАУНТОВ")
    print("=" * 60)
    print()
    print("Меняем Mobile User-Agent → Desktop User-Agent")
    print()
    
    converted = convert_accounts()
    
    print("# ==================== НОВЫЙ ФОРМАТ ====================")
    print("INSTAGRAM_ACCOUNTS = [")
    for acc in converted:
        # Показываем укороченную версию
        parts = acc.split("|")
        login = parts[0].split(":")[0]
        ua_short = parts[1][:50] + "..."
        print(f'    "{acc}",')
    print("]")
    
    print()
    print("=" * 60)
    print(f"✅ Конвертировано: {len(converted)} аккаунтов")
    print("=" * 60)
    
    # Сохраняем в файл
    with open("instagram_accounts_converted.py", "w", encoding="utf-8") as f:
        f.write("# ==================== INSTAGRAM ACCOUNTS (Desktop UA) ====================\n")
        f.write("INSTAGRAM_ACCOUNTS = [\n")
        for acc in converted:
            f.write(f'    "{acc}",\n')
        f.write("]\n")
    
    print()
    print("📄 Сохранено в: instagram_accounts_converted.py")
    print()
    print("Скопируй содержимое файла в bot.py")


if __name__ == "__main__":
    main()
