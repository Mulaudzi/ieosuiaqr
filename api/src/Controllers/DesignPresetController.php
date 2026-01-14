<?php

namespace App\Controllers;

use App\Config\Database;
use App\Helpers\Response;
use App\Helpers\Validator;
use App\Middleware\Auth;

class DesignPresetController
{
    private $db;
    private $userId;

    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->userId = Auth::getUserId();
    }

    /**
     * GET /api/design-presets
     * Get all design presets for current user
     */
    public function index()
    {
        if (!$this->userId) {
            return Response::error('Unauthorized', 401);
        }

        try {
            $stmt = $this->db->prepare("
                SELECT id, user_id, name, description, design_options, 
                       thumbnail_url, is_default, created_at, updated_at
                FROM design_presets
                WHERE user_id = ?
                ORDER BY is_default DESC, created_at DESC
            ");
            $stmt->execute([$this->userId]);
            $presets = $stmt->fetchAll();

            // Parse JSON design_options
            foreach ($presets as &$preset) {
                $preset['design_options'] = json_decode($preset['design_options'], true);
                $preset['is_default'] = (bool) $preset['is_default'];
            }

            return Response::success($presets);
        } catch (\Exception $e) {
            return Response::error('Failed to fetch presets: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/design-presets/{id}
     * Get a single design preset
     */
    public function show($id)
    {
        if (!$this->userId) {
            return Response::error('Unauthorized', 401);
        }

        try {
            $stmt = $this->db->prepare("
                SELECT * FROM design_presets
                WHERE id = ? AND user_id = ?
            ");
            $stmt->execute([$id, $this->userId]);
            $preset = $stmt->fetch();

            if (!$preset) {
                return Response::error('Preset not found', 404);
            }

            $preset['design_options'] = json_decode($preset['design_options'], true);
            $preset['is_default'] = (bool) $preset['is_default'];

            return Response::success($preset);
        } catch (\Exception $e) {
            return Response::error('Failed to fetch preset: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/design-presets
     * Create a new design preset
     */
    public function store()
    {
        if (!$this->userId) {
            return Response::error('Unauthorized', 401);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        $validation = Validator::validate($data, [
            'name' => 'required|string|max:100',
            'design_options' => 'required|array',
        ]);

        if (!$validation['valid']) {
            return Response::error($validation['errors'], 422);
        }

        try {
            // Check preset limit (max 20 per user)
            $stmt = $this->db->prepare("SELECT COUNT(*) FROM design_presets WHERE user_id = ?");
            $stmt->execute([$this->userId]);
            $count = $stmt->fetchColumn();

            if ($count >= 20) {
                return Response::error('Maximum preset limit (20) reached', 403);
            }

            // If this is set as default, unset other defaults
            if (!empty($data['is_default'])) {
                $stmt = $this->db->prepare("UPDATE design_presets SET is_default = 0 WHERE user_id = ?");
                $stmt->execute([$this->userId]);
            }

            $id = $this->generateUuid();
            $now = date('Y-m-d H:i:s');

            $stmt = $this->db->prepare("
                INSERT INTO design_presets 
                (id, user_id, name, description, design_options, is_default, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $id,
                $this->userId,
                $data['name'],
                $data['description'] ?? null,
                json_encode($data['design_options']),
                !empty($data['is_default']) ? 1 : 0,
                $now,
                $now,
            ]);

            // Fetch the created preset
            $stmt = $this->db->prepare("SELECT * FROM design_presets WHERE id = ?");
            $stmt->execute([$id]);
            $preset = $stmt->fetch();
            $preset['design_options'] = json_decode($preset['design_options'], true);
            $preset['is_default'] = (bool) $preset['is_default'];

            return Response::success($preset, 'Preset created successfully', 201);
        } catch (\Exception $e) {
            return Response::error('Failed to create preset: ' . $e->getMessage(), 500);
        }
    }

    /**
     * PUT /api/design-presets/{id}
     * Update a design preset
     */
    public function update($id)
    {
        if (!$this->userId) {
            return Response::error('Unauthorized', 401);
        }

        $data = json_decode(file_get_contents('php://input'), true);

        try {
            // Check ownership
            $stmt = $this->db->prepare("SELECT * FROM design_presets WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $this->userId]);
            $preset = $stmt->fetch();

            if (!$preset) {
                return Response::error('Preset not found', 404);
            }

            $updates = [];
            $params = [];

            if (isset($data['name'])) {
                $updates[] = "name = ?";
                $params[] = $data['name'];
            }

            if (array_key_exists('description', $data)) {
                $updates[] = "description = ?";
                $params[] = $data['description'];
            }

            if (isset($data['design_options'])) {
                $updates[] = "design_options = ?";
                $params[] = json_encode($data['design_options']);
            }

            if (isset($data['is_default']) && $data['is_default']) {
                // Unset other defaults first
                $stmt = $this->db->prepare("UPDATE design_presets SET is_default = 0 WHERE user_id = ?");
                $stmt->execute([$this->userId]);
                $updates[] = "is_default = 1";
            }

            if (empty($updates)) {
                return Response::error('No fields to update', 400);
            }

            $updates[] = "updated_at = ?";
            $params[] = date('Y-m-d H:i:s');
            $params[] = $id;

            $stmt = $this->db->prepare("UPDATE design_presets SET " . implode(', ', $updates) . " WHERE id = ?");
            $stmt->execute($params);

            // Fetch updated preset
            $stmt = $this->db->prepare("SELECT * FROM design_presets WHERE id = ?");
            $stmt->execute([$id]);
            $preset = $stmt->fetch();
            $preset['design_options'] = json_decode($preset['design_options'], true);
            $preset['is_default'] = (bool) $preset['is_default'];

            return Response::success($preset, 'Preset updated successfully');
        } catch (\Exception $e) {
            return Response::error('Failed to update preset: ' . $e->getMessage(), 500);
        }
    }

    /**
     * DELETE /api/design-presets/{id}
     * Delete a design preset
     */
    public function destroy($id)
    {
        if (!$this->userId) {
            return Response::error('Unauthorized', 401);
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM design_presets WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $this->userId]);
            $preset = $stmt->fetch();

            if (!$preset) {
                return Response::error('Preset not found', 404);
            }

            $stmt = $this->db->prepare("DELETE FROM design_presets WHERE id = ?");
            $stmt->execute([$id]);

            return Response::success(null, 'Preset deleted successfully');
        } catch (\Exception $e) {
            return Response::error('Failed to delete preset: ' . $e->getMessage(), 500);
        }
    }

    /**
     * POST /api/design-presets/{id}/set-default
     * Set a preset as the default
     */
    public function setDefault($id)
    {
        if (!$this->userId) {
            return Response::error('Unauthorized', 401);
        }

        try {
            $stmt = $this->db->prepare("SELECT * FROM design_presets WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $this->userId]);
            $preset = $stmt->fetch();

            if (!$preset) {
                return Response::error('Preset not found', 404);
            }

            // Unset all defaults
            $stmt = $this->db->prepare("UPDATE design_presets SET is_default = 0 WHERE user_id = ?");
            $stmt->execute([$this->userId]);

            // Set this one as default
            $stmt = $this->db->prepare("UPDATE design_presets SET is_default = 1, updated_at = ? WHERE id = ?");
            $stmt->execute([date('Y-m-d H:i:s'), $id]);

            // Return updated preset
            $stmt = $this->db->prepare("SELECT * FROM design_presets WHERE id = ?");
            $stmt->execute([$id]);
            $preset = $stmt->fetch();
            $preset['design_options'] = json_decode($preset['design_options'], true);
            $preset['is_default'] = true;

            return Response::success($preset, 'Default preset updated');
        } catch (\Exception $e) {
            return Response::error('Failed to set default: ' . $e->getMessage(), 500);
        }
    }

    private function generateUuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
