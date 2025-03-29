import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timer'
})
export class TimerPipe implements PipeTransform {

  transform(value: number): unknown {
    const minutes: number = Math.floor(value / 60);
    const seconds: number = value % 60;

    const minutesString = minutes < 10 ? '0' + minutes : minutes;
    const secondsString = seconds < 10 ? '0' + seconds : seconds;

    return `${minutesString}:${secondsString}`;
  }

}
