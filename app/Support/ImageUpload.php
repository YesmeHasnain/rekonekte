<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Saves a base64 image from the browser into public/uploads. The file type comes
 * from the bytes themselves, never from what the request claims, so only real
 * images land in a web-served folder.
 */
class ImageUpload
{
    private const MAX_BYTES = 8 * 1024 * 1024;

    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif',
    ];

    /** Returns the public path, or null if this isn't an accepted image. */
    public static function store(string $dataUrl, string $folder, string $prefix = ''): ?string
    {
        if (! preg_match('/^data:image\/[\w.+-]+;base64,/', $dataUrl, $m)) {
            return null;
        }
        $bytes = base64_decode(substr($dataUrl, strlen($m[0])), true);
        if ($bytes === false || $bytes === '' || strlen($bytes) > self::MAX_BYTES) {
            return null;
        }

        $mime = (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes);
        if (! isset(self::TYPES[$mime]) || getimagesizefromstring($bytes) === false) {
            return null;
        }

        $dir = public_path('uploads/'.$folder);
        if (! is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $name = $prefix.Str::random(24).'.'.self::TYPES[$mime];
        file_put_contents($dir.'/'.$name, $bytes);

        return '/uploads/'.$folder.'/'.$name;
    }
}
