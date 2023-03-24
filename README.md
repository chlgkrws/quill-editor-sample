## 개요
Quill.js 를 사용하여 Editor(편집기) 기능을 제공하는 예제 소스입니다.


## 환경
<img src="https://img.shields.io/badge/Spring Boot-6DB33F?style=for-the-badge&logo=SpringBoot&logoColor=white">
<img src="https://img.shields.io/badge/Thyme leaf-green?style=for-the-badge&logo=Thymeleaf&logoColor=white">
<img src="https://img.shields.io/badge/Javascript-yellow?style=for-the-badge&logo=Javascript&logoColor=white">

## 예제
Application을 실행한 뒤, 브라우저에서 아래 URl를 조회하면 기능에 맞는 Quill.js 예제를 확인할 수 있습니다.

| URL                    | 기능       | 설명                 | 파일                   |
|------------------------|----------|--------------------|----------------------|
| /quill/basic           | 기본 레이아웃 확인 | -                  | basic.html           |
| /quill/basic-data      | 데이터 제어   | 일반 텍스트 삽입/조회       | basic-data.html      |
| /quill/basic-data/json | Json 데이터 제어 | Json 데이터 삽입/조회     | basic-data-json.html | 
| /quill/basic-readonly  | 읽기전용 모드  | 입력 제어(readonly)    | basic-readonly.html  | 
| /quill/basic-reset     | 데이터 초기화  | 기입력 내용 삭제          | basic-reset.html     | 
| /quill/custom          | 커스텀 모듈 사용 | 커스텀 모듈 사용(isEmpty) | custom.html          | 
| /quill/change          | 수정/읽기 모드 | 수정/읽기 모드 전환        | change-mode.html     | 

## 부가 기능

- Quill 커스텀 모듈 추가
   - /resources/assets/js/quill-custom.js 참조


## Reference
- [Github - Quilljs](https://github.com/quilljs/quill)

- [Documentation](https://quilljs.com/docs/quickstart/)