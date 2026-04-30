// i18n translations for La Reta
export const i18n = {
  es: {
    // Menú
    menu_play: 'JUGAR',
    menu_how_to_play: 'CÓMO JUGAR',
    menu_high_score: (n) => `Mejor puntuación: ${n}`,

    // Tutorial
    tutorial_next: 'SIGUIENTE',
    tutorial_back: 'VOLVER',

    tutorial_0_title: 'CÓMO JUGAR',
    tutorial_0_line1: 'Toca la pantalla para patear la pelota.',
    tutorial_0_line2: 'La posición del toque determina la dirección.',
    tutorial_0_line3: '¡No dejes que caiga al suelo!',

    tutorial_1_title: 'PUNTUACIÓN',
    tutorial_1_line1: '+1 punto por cada toque.',
    tutorial_1_line2: 'El combo crece con cada toque consecutivo.',
    tutorial_1_line3: 'Sobrevive el mayor tiempo posible.',
    tutorial_1_line4: '¡El balón se vuelve más difícil con el tiempo!',

    tutorial_2_title: 'FÍSICA DEL BALÓN',
    tutorial_2_left:  'Toque derecha\n→ balón va izquierda',
    tutorial_2_right: 'Toque izquierda\n→ balón va derecha',
    tutorial_2_below: 'Toque abajo\n→ sube más alto',
    tutorial_2_gravity: 'Gravedad\nconstante',
    tutorial_2_hitbox: 'Toca más cerca del centro = más control',

    tutorial_3_title: 'POWERUPS',
    tutorial_3_rebote:      'REBOTE\nSalva una caída',
    tutorial_3_precision:   'PRECISIÓN\nMenos spin',
    tutorial_3_perfectzone: 'PERFECT ZONE\nTodo es PERFECT',
    tutorial_3_doble:       'DOBLE O NADA\nx2 score, más velocidad',
    tutorial_3_fuego:       'FUEGO\nCombo rápido, reset total',

    tutorial_4_title: 'TIPS',
    tutorial_4_line1: 'Toca cerca del centro para control máximo.',
    tutorial_4_line2: 'Los powerups flotan 3 segundos — ¡no los pierdas!',
    tutorial_4_line3: 'La pelota se vuelve más inestable con el tiempo.',

    // HUD
    game_score: 'Score',
    game_combo: 'Combo',
    game_pause: 'PAUSA',
    game_pause_continue: 'CONTINUAR',
    game_pause_quit: 'ABANDONAR',

    // Settings
    settings_title: 'CONFIGURACIÓN',

    // Hit types
    hit_normal: 'NORMAL',
    hit_good: 'GOOD!',
    hit_perfect: '⚽ PERFECT!',

    // Powerup toasts
    toast_rebote: '🛡 REBOTE — próxima caída salvada',
    toast_precision: '🎯 PRECISIÓN — menos spin (5s)',
    toast_perfectzone: '⭐ PERFECT ZONE (5s)',
    toast_doble: '💰 DOBLE O NADA — x2 score!',
    toast_fuego: '🔥 FUEGO — combo turbo!',
    toast_saved: '🛡 ¡SALVADO!',
    toast_combo: (n) => `🔥 COMBO x${n}`,

    // Game Over
    gameover_title: 'GAME OVER',
    gameover_score: (n) => `Puntuación: ${n}`,
    gameover_high_score: (n) => `Mejor: ${n}`,
    gameover_play_again: 'JUGAR DE NUEVO',
    gameover_menu: 'MENÚ',
    gameover_save_prompt: 'Guarda tu puntuación:',
    gameover_input_placeholder: 'Toca para escribir...',
    gameover_saved_status: '✓ ¡Guardado!',
    gameover_error: 'Error al guardar',
    gameover_leaderboard: 'LEADERBOARD',

    // Leaderboard
    leaderboard_loading: 'Cargando...',
    leaderboard_error: 'Error al cargar',
    leaderboard_empty: 'Sin registros aún.\n¡Sé el primero!',
  },

  en: {
    // Menu
    menu_play: 'PLAY',
    menu_how_to_play: 'HOW TO PLAY',
    menu_high_score: (n) => `Best score: ${n}`,

    // Tutorial
    tutorial_next: 'NEXT',
    tutorial_back: 'BACK',

    tutorial_0_title: 'HOW TO PLAY',
    tutorial_0_line1: 'Tap the screen to kick the ball.',
    tutorial_0_line2: 'Tap position controls ball direction.',
    tutorial_0_line3: "Don't let it hit the ground!",

    tutorial_1_title: 'SCORING',
    tutorial_1_line1: '+1 point per touch.',
    tutorial_1_line2: 'Combo grows with every consecutive touch.',
    tutorial_1_line3: 'Survive as long as possible.',
    tutorial_1_line4: 'The ball gets harder to control over time!',

    tutorial_2_title: 'BALL PHYSICS',
    tutorial_2_left:  'Tap right\n→ ball goes left',
    tutorial_2_right: 'Tap left\n→ ball goes right',
    tutorial_2_below: 'Tap below\n→ goes higher',
    tutorial_2_gravity: 'Constant\ngravity',
    tutorial_2_hitbox: 'Tap closer to center = more control',

    tutorial_3_title: 'POWERUPS',
    tutorial_3_rebote:      'REBOTE\nSaves next fail',
    tutorial_3_precision:   'PRECISION\nLess spin',
    tutorial_3_perfectzone: 'PERFECT ZONE\nAll hits = PERFECT',
    tutorial_3_doble:       'DOBLE O NADA\nx2 score, more speed',
    tutorial_3_fuego:       'FUEGO\nFast combo, full reset',

    tutorial_4_title: 'TIPS',
    tutorial_4_line1: 'Tap near center for maximum control.',
    tutorial_4_line2: 'Powerups float for 3 seconds — grab them!',
    tutorial_4_line3: 'The ball gets harder to control over time.',

    // HUD
    game_score: 'Score',
    game_combo: 'Combo',
    game_pause: 'PAUSE',
    game_pause_continue: 'CONTINUE',
    game_pause_quit: 'QUIT',

    // Settings
    settings_title: 'SETTINGS',

    // Hit types
    hit_normal: 'NORMAL',
    hit_good: 'GOOD!',
    hit_perfect: '⚽ PERFECT!',

    // Powerup toasts
    toast_rebote: '🛡 REBOTE — next fail saved',
    toast_precision: '🎯 PRECISION — less spin (5s)',
    toast_perfectzone: '⭐ PERFECT ZONE (5s)',
    toast_doble: '💰 DOBLE O NADA — x2 score!',
    toast_fuego: '🔥 FUEGO — turbo combo!',
    toast_saved: '🛡 SAVED!',
    toast_combo: (n) => `🔥 COMBO x${n}`,

    // Game Over
    gameover_title: 'GAME OVER',
    gameover_score: (n) => `Score: ${n}`,
    gameover_high_score: (n) => `Best: ${n}`,
    gameover_play_again: 'PLAY AGAIN',
    gameover_menu: 'MENU',
    gameover_save_prompt: 'Save your score:',
    gameover_input_placeholder: 'Tap to type...',
    gameover_saved_status: '✓ Saved!',
    gameover_error: 'Error saving',
    gameover_leaderboard: 'LEADERBOARD',

    // Leaderboard
    leaderboard_loading: 'Loading...',
    leaderboard_error: 'Error loading',
    leaderboard_empty: 'No records yet.\nBe the first!',
  }
};
