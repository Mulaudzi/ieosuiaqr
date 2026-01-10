<?php

namespace App\Helpers;

class Validator
{
    private array $errors = [];
    private array $data;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function required(string $field, ?string $message = null): self
    {
        if (!isset($this->data[$field]) || trim($this->data[$field]) === '') {
            $this->errors[$field] = $message ?? "{$field} is required";
        }
        return $this;
    }

    public function email(string $field, ?string $message = null): self
    {
        if (isset($this->data[$field]) && !filter_var($this->data[$field], FILTER_VALIDATE_EMAIL)) {
            $this->errors[$field] = $message ?? "Invalid email format";
        }
        return $this;
    }

    public function minLength(string $field, int $length, ?string $message = null): self
    {
        if (isset($this->data[$field]) && strlen($this->data[$field]) < $length) {
            $this->errors[$field] = $message ?? "{$field} must be at least {$length} characters";
        }
        return $this;
    }

    public function maxLength(string $field, int $length, ?string $message = null): self
    {
        if (isset($this->data[$field]) && strlen($this->data[$field]) > $length) {
            $this->errors[$field] = $message ?? "{$field} must not exceed {$length} characters";
        }
        return $this;
    }

    public function in(string $field, array $allowed, ?string $message = null): self
    {
        if (isset($this->data[$field]) && !in_array($this->data[$field], $allowed)) {
            $this->errors[$field] = $message ?? "{$field} must be one of: " . implode(', ', $allowed);
        }
        return $this;
    }

    public function numeric(string $field, ?string $message = null): self
    {
        if (isset($this->data[$field]) && !is_numeric($this->data[$field])) {
            $this->errors[$field] = $message ?? "{$field} must be a number";
        }
        return $this;
    }

    public function isValid(): bool
    {
        return empty($this->errors);
    }

    public function getErrors(): array
    {
        return $this->errors;
    }

    public function validate(): void
    {
        if (!$this->isValid()) {
            Response::error('Validation failed', 422, $this->errors);
        }
    }
}
