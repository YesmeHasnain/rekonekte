<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="robots" content="noindex">
    <title>Rekonekte — Lanmou · Kominote · Lakay</title>
    <meta name="description" content="Rekonekte — the dating and community platform for the Haitian diaspora.">
    <link rel="icon" href="/img/logo-mark.png">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Kaushan+Script&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite('resources/js/main.jsx')
</head>
<body>
    <div id="root"></div>
</body>
</html>
