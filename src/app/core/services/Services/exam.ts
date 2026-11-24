import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import {  CreateQuizPayload, QuizResponse, UpdateQuiz } from '../../../Main/Models/creat-exam.model';
import { environment } from '../../../environments/environment';
import { InstructorQuiz, QuizDetailsResponse } from '../../../Main/Models/quiz.mpdel';

@Service()
export class Exam {
private http=inject(HttpClient);
 private readonly api = environment.apiUrl; 
addExam(exam:CreateQuizPayload){
return this.http.post<QuizResponse>(`${this.api}quiz/`,exam);
}
  getInsExams() {
    return this.http.get<InstructorQuiz[]>(`${this.api}quiz/insQuizes`);
  }

  getQuizDetails(quizId: number) {
  return this.http.get<QuizDetailsResponse>(
    `${this.api}quiz/quiz-details/${quizId}`
  );
}

updateQuiz(exam:UpdateQuiz,quizId:number){
return this.http.patch<QuizResponse>(`${this.api}quiz/${quizId}`,exam);
}

deleteQuiz(quizId:number){
return this.http.delete<QuizResponse>(`${this.api}quiz/${quizId}`);
}


}

