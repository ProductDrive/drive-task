import { useState } from 'react';

export function useMenu() {
    const [menuVisible, setMenuVisible] = useState(false);

    const toggleMenu = () => setMenuVisible((p) => !p);
    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);

    return { menuVisible, toggleMenu, openMenu, closeMenu, setMenuVisible };
}