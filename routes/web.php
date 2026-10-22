<?php

use Illuminate\Support\Facades\Route;

// The UI is a React single-page app (resources/js). Every non-API path returns
// the same shell and react-router draws the page.
Route::view('/{any?}', 'app')->where('any', '^(?!api|build|img|storage).*$');
