package com.project.backend_api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Slf4j
@Component
public class AfterCommit {

    public void run(Runnable action) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        action.run();
                    } catch (RuntimeException exception) {
                        log.warn("커밋 이후 외부 저장소 정리에 실패했습니다. DB 삭제는 유지됩니다.");
                    }
                }
            });
            return;
        }
        action.run();
    }
}
