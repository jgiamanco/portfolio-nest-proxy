import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeatherModule } from './modules/weather/weather.module';
import { StockModule } from './modules/stock/stock.module';
import { OpenAIModule } from './modules/openai/openai.module';
import { SportsModule } from './modules/sports/sports.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WeatherModule,
    StockModule,
    OpenAIModule,
    SportsModule,
  ],
})
export class AppModule {}
