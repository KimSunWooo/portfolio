package com.project.backend_api.verify;

import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Profile("verify")
public class VerifySupportController {

    private final VerifyMailbox mailbox;
    private final VerifySessionRevokeFault revokeFault;
    private final VerifyProductFaultFilter productFault;

    public VerifySupportController(
            VerifyMailbox mailbox,
            VerifySessionRevokeFault revokeFault,
            VerifyProductFaultFilter productFault
    ) {
        this.mailbox = mailbox;
        this.revokeFault = revokeFault;
        this.productFault = productFault;
    }

    @GetMapping("/api/verify/mailbox")
    public ResponseEntity<String> mailbox(@RequestParam String email) {
        String text = mailbox.latest(email);
        if (text == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(text);
    }

    @PostMapping("/api/verify/fail-next-revoke")
    public ResponseEntity<Void> failNextRevoke() {
        revokeFault.failNextRevoke();
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/api/verify/fail-next-product")
    public ResponseEntity<Void> failNextProduct() {
        productFault.failNextDetail();
        return ResponseEntity.noContent().build();
    }
}
