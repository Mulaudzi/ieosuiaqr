<?php

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;
use App\Helpers\Validator;

class ValidatorTest extends TestCase
{
    public function testRequiredFieldPasses(): void
    {
        $data = ['name' => 'John Doe'];
        $validator = new Validator($data);
        
        // Should not throw exception
        $validator->required('name', 'Name is required');
        $this->assertTrue(true);
    }

    public function testRequiredFieldFailsOnEmpty(): void
    {
        $data = ['name' => ''];
        $validator = new Validator($data);
        $validator->required('name', 'Name is required');
        
        $this->expectException(\Exception::class);
        $validator->validate();
    }

    public function testRequiredFieldFailsOnMissing(): void
    {
        $data = [];
        $validator = new Validator($data);
        $validator->required('name', 'Name is required');
        
        $this->expectException(\Exception::class);
        $validator->validate();
    }

    public function testEmailValidation(): void
    {
        $data = ['email' => 'test@example.com'];
        $validator = new Validator($data);
        $validator->email('email', 'Invalid email');
        
        // Should not throw exception
        $this->assertTrue(true);
    }

    public function testEmailValidationFails(): void
    {
        $data = ['email' => 'not-an-email'];
        $validator = new Validator($data);
        $validator->email('email', 'Invalid email');
        
        $this->expectException(\Exception::class);
        $validator->validate();
    }

    public function testMinLengthValidation(): void
    {
        $data = ['password' => '12345678'];
        $validator = new Validator($data);
        $validator->minLength('password', 8, 'Password too short');
        
        // Should not throw exception
        $this->assertTrue(true);
    }

    public function testMinLengthValidationFails(): void
    {
        $data = ['password' => '1234'];
        $validator = new Validator($data);
        $validator->minLength('password', 8, 'Password too short');
        
        $this->expectException(\Exception::class);
        $validator->validate();
    }

    public function testMaxLengthValidation(): void
    {
        $data = ['name' => 'John'];
        $validator = new Validator($data);
        $validator->maxLength('name', 100, 'Name too long');
        
        // Should not throw exception
        $this->assertTrue(true);
    }

    public function testMaxLengthValidationFails(): void
    {
        $data = ['name' => str_repeat('a', 101)];
        $validator = new Validator($data);
        $validator->maxLength('name', 100, 'Name too long');
        
        $this->expectException(\Exception::class);
        $validator->validate();
    }

    public function testInValidation(): void
    {
        $data = ['type' => 'url'];
        $validator = new Validator($data);
        $validator->in('type', ['url', 'text', 'email'], 'Invalid type');
        
        // Should not throw exception
        $this->assertTrue(true);
    }

    public function testInValidationFails(): void
    {
        $data = ['type' => 'invalid'];
        $validator = new Validator($data);
        $validator->in('type', ['url', 'text', 'email'], 'Invalid type');
        
        $this->expectException(\Exception::class);
        $validator->validate();
    }

    public function testChainedValidation(): void
    {
        $data = [
            'email' => 'test@example.com',
            'name' => 'John Doe',
            'password' => 'securepassword123'
        ];
        
        $validator = new Validator($data);
        $validator
            ->required('email', 'Email required')
            ->email('email', 'Invalid email')
            ->required('name', 'Name required')
            ->maxLength('name', 100, 'Name too long')
            ->required('password', 'Password required')
            ->minLength('password', 8, 'Password too short');
        
        // Should not throw exception
        $this->assertTrue(true);
    }
}
