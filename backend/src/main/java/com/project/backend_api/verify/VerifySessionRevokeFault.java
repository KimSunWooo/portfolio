package com.project.backend_api.verify;

import com.project.backend_api.security.SessionRevokeFault;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicBoolean;

@Component
@Profile("verify")
public class VerifySessionRevokeFault implements SessionRevokeFault {

    private final AtomicBoolean failNext = new AtomicBoolean();

    public void failNextRevoke() {
        failNext.set(true);
    }

    @Override
    public void beforeRevoke() {
        if (failNext.compareAndSet(true, false)) {
            throw new IllegalStateException("인증 세션을 폐기하지 못했습니다.");
        }
    }
}
