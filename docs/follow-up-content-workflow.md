# 콘텐츠 초안·게시·충돌·이력

이번 배포 스키마에는 초안/게시 상태, 수정 버전, 변경 이력 테이블이 없다.

`projects.status`는 PLANNING, IN_PROGRESS, COMPLETED만 저장한다. 이 값을 초안/게시로 바꾸면 기존 화면의 상태 표시가 달라지므로 사용하지 않았다.

운영 `ddl-auto=validate`를 유지하려면 아래 컬럼과 테이블을 적용한 뒤에만 코드 경로에 넣을 수 있다.

- projects.workflow_status
- projects.version
- project_revisions(project_id, version, editor, snapshot, created_at)

이번 작업에서는 migration을 실행하지 않았고, 애플리케이션 기본 경로에도 넣지 않았다.
