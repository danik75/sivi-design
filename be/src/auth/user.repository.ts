import { Injectable } from '@nestjs/common';
import pool from '../db';

@Injectable()
export class UserRepository {
  async findByUsername(username: string): Promise<{ id: number; username: string; password: string } | null> {
    const res = await pool.query('SELECT id, username, password FROM users WHERE username = $1 LIMIT 1', [username]);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  }
}
