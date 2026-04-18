export class DiffProcessor {
  /**
   * Masks potential secrets in the diff using basic regex.
   * In a real production system, you'd use a more robust library like Gitleaks or TruffleHog.
   */
  static maskSecrets(diff: string): string {
    const patterns = [
      { name: 'Generic Secret', regex: /(secret|password|token|key|auth|api_key|access_token)["']?\s*[:=]\s*["']?([a-zA-Z0-9-_.]{8,})["']?/gi },
      { name: 'AWS Key', regex: /AKIA[0-9A-Z]{16}/g },
      { name: 'GitHub Token', regex: /gh[pousr]_[a-zA-Z0-9]{36}/g }
    ];

    let maskedDiff = diff;
    patterns.forEach(p => {
      maskedDiff = maskedDiff.replace(p.regex, (match, p1, p2) => {
        if (p2) return match.replace(p2, '********');
        return '********';
      });
    });

    return maskedDiff;
  }

  /**
   * Simple chunking logic if the diff is too large for a single LLM call.
   * For this implementation, we mostly use it to enforce limits.
   */
  static process(diff: string, maxSize: number): string {
    let processed = this.maskSecrets(diff);
    
    if (processed.length > maxSize) {
      processed = processed.substring(0, maxSize) + '\n\n... (diff truncated due to size limits)';
    }

    return processed;
  }
}
