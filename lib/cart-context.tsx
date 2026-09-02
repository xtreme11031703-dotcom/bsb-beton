'use client';

// Общая корзина заказа — используется и страницами каталога (app/catalog),
// где можно добавлять товары просматривая каталог, и мастером оформления
// заказа (app/order/new/OrderWizard.tsx), где можно набрать те же позиции
// пошагово. Оба способа работают с одной и той же корзиной: можно начать в
// каталоге, доехать до мастера заказа и там же добавить ещё позицию (или
// наоборот) — как попросил заказчик.
//
// Хранится в localStorage браузера (не на сервере и не привязано к
// аккаунту) — корзина собирается ДО оформления заказа и до входа в систему,
// точно как в обычном интернет-магазине. После успешного оформления заказа
// (OrderWizard вызывает clearCart()) корзина очищается.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { type CartItem, makeCartItemKey } from '@/lib/catalog';

const STORAGE_KEY = 'bsb_cart_v1';

type CartContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Читаем localStorage один раз на клиенте после монтирования (на сервере
  // его нет, а до гидратации значение всё равно должно совпадать с SSR-разметкой).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // повреждённые данные в localStorage — просто начинаем с пустой корзины
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return; // не перетираем localStorage до того, как прочитали его
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage недоступен (приватный режим и т.п.) — корзина просто не переживёт перезагрузку страницы
    }
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem: (item) => setItems((current) => [...current, { ...item, key: item.key || makeCartItemKey() }]),
      removeItem: (key) => setItems((current) => current.filter((i) => i.key !== key)),
      clearCart: () => setItems([]),
      count: items.length,
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart() должен использоваться внутри <CartProvider>');
  return ctx;
}
