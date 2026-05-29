import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { SleepStorageService } from '../../services/sleep-storage.service';
import { formatTime } from '../../models/sleep-utils';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  protected service = inject(SleepStorageService);
  protected formatTime = formatTime;

  deleteRecord(id: string): void {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
      this.service.deleteRecord(id);
    }
  }
}
