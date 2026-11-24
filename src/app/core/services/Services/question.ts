import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { environment } from '../../../environments/environment';
import {  CreateChoicePayload, CreateQuestionPayload, CreateQuestionsPayload, QuizQuestionResponse } from '../../../Main/Models/add-question.model';
import { Observable } from 'rxjs';
// Assumed to match UpdateQuestionDto. See NEEDS TO BE CHANGED.
export interface UpdateChoicePayload extends CreateChoicePayload {
  id?: number;
}

export interface UpdateQuestionPayload extends Omit<CreateQuestionPayload, 'choices'> {
  choices: UpdateChoicePayload[];
}
@Service()
export class Questions {
private http=inject(HttpClient);
 private readonly api = environment.apiUrl; 
addQuestion(questions:CreateQuestionsPayload):Observable<QuizQuestionResponse[]>{
return this.http.post<QuizQuestionResponse[]>(`${this.api}question/`,questions);
}

  // NEEDS TO BE CHANGED: use the real prefix of your question controller + @Patch(':id')
  updateQuestion(questionId: number, payload: UpdateQuestionPayload): Observable<QuizQuestionResponse> {
    return this.http.patch<QuizQuestionResponse>(`${this.api}question/${questionId}`, payload);
  }

  deleteQuestion(questionId:number){
    return this.http.delete<QuizQuestionResponse>(`${this.api}question/${questionId}`);

  }
}
