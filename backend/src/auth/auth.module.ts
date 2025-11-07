import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';

// Imports and exports the PassportModule using our JwtStrategy defined in jwt.strategy.ts. This is to authenticate controllers
// The AuthService is exported, which is lower level and should be used to authenticate Gateways
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, AuthService],
  exports: [PassportModule, AuthService],
})
export class AuthModule {}
