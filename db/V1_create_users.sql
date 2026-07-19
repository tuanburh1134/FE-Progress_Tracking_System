-- =============================================================================
-- V1: Tạo bảng users
-- Phiên bản: 1.0.0
-- Mô tả: Bảng lưu thông tin tài khoản người dùng
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id              BIGINT          NOT NULL AUTO_INCREMENT,
    username        VARCHAR(50)     NOT NULL,
    email           VARCHAR(100)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    full_name       VARCHAR(100),
    avatar_url      VARCHAR(500),
    role            VARCHAR(20)     NOT NULL DEFAULT 'MEMBER',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      DATETIME(6)     NOT NULL,
    updated_at      DATETIME(6),

    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_email UNIQUE (email),
    CONSTRAINT uk_users_username UNIQUE (username),
    CONSTRAINT chk_users_role CHECK (role IN ('ADMIN', 'PROJECT_MANAGER', 'MEMBER'))
);

-- Index cho tìm kiếm nhanh
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Insert dữ liệu admin mặc định (password: Admin@123)
INSERT INTO users (username, email, password_hash, full_name, role, is_active, created_at)
VALUES ('admin', 'admin@projecttracker.com',
        '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iKPriSMUP5jRLHEJoJ6NLiyjRvlm',
        'System Administrator', 'ADMIN', TRUE, NOW());
