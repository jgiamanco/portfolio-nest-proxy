import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeatherModule } from './modules/weather/weather.module';
import { StockModule } from './modules/stock/stock.module';
import { SportsModule } from './modules/sports/sports.module';
import { ChatbotModule } from './modules/chatbot/chatbot.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    WeatherModule,
    StockModule,
    SportsModule,
    ChatbotModule,
  ],
})
export class AppModule {}
