<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pass extends Model
{
    protected $fillable = ['user_id', 'passed_id'];
}
