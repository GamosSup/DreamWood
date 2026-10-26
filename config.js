// Публичные значения (не секретные): publishable key безопасен в браузере при включённой RLS.
window.APP_CONFIG = {
  SUPABASE_URL: "https://bvlwpfmtcdgfsomvwqrp.supabase.co",
  // адреса приложения: если на текущем не работает связь с базой, приложение само переходит на другой рабочий
  ORIGINS: ["https://dreamwood.pages.dev", "https://201-24-62-2.sslip.io"],
  VAPID_PUBLIC: "BEieXMpbyL0dEAfqywdEM55EkRSMoxCzgcmVrxhzn1ynmyTRK_rEm_zGyaQqrZhWEDRb5ziKQxaIchiko-KNF4Q",
  SUPABASE_ANON_KEY: "sb_publishable_S7nnUv3hs2bBZDhYhEFYew_j_S6s1sO"
};
